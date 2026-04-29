from .models import CustomUser, Notification


def _get_user_display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def _dedupe_users(users):
    unique_users = []
    seen_ids = set()

    for user in users:
        if not user or user.pk in seen_ids:
            continue
        unique_users.append(user)
        seen_ids.add(user.pk)

    return unique_users


def create_notification(recipient, title, message, notification_type, actor=None, data=None):
    if not recipient:
        return None

    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        title=title,
        message=message,
        notification_type=notification_type,
        data=data or {},
    )


def create_notifications(recipients, title, message, notification_type, actor=None, data=None):
    unique_recipients = _dedupe_users(recipients)
    notifications = [
        Notification(
            recipient=recipient,
            actor=actor,
            title=title,
            message=message,
            notification_type=notification_type,
            data=data or {},
        )
        for recipient in unique_recipients
    ]

    if notifications:
        Notification.objects.bulk_create(notifications)

    return notifications


def notify_placement_created(placement, actor=None):
    student_name = _get_user_display_name(placement.student)
    placement_data = {
        "placement_id": placement.id,
        "status": placement.status,
    }

    create_notification(
        recipient=placement.student,
        actor=actor,
        title="Internship placement assigned",
        message=(
            f"You have been assigned to {placement.company_name} from "
            f"{placement.start_date} to {placement.end_date}."
        ),
        notification_type="placement_created",
        data=placement_data,
    )
    create_notification(
        recipient=placement.workplace_supervisor,
        actor=actor,
        title="New intern placement assigned",
        message=f"{student_name} has been assigned to your supervision at {placement.company_name}.",
        notification_type="placement_created",
        data=placement_data,
    )
    create_notification(
        recipient=placement.academic_supervisor,
        actor=actor,
        title="New academic supervision assignment",
        message=f"{student_name} has been assigned to you for academic supervision at {placement.company_name}.",
        notification_type="placement_created",
        data=placement_data,
    )


def notify_placement_status_updated(placement, previous_status, actor=None):
    student_name = _get_user_display_name(placement.student)
    message = (
        f"The internship placement for {student_name} at {placement.company_name} changed from "
        f"{previous_status.replace('_', ' ')} to {placement.status.replace('_', ' ')}."
    )

    create_notifications(
        recipients=[placement.student, placement.workplace_supervisor, placement.academic_supervisor],
        title="Placement status updated",
        message=message,
        notification_type="placement_status_updated",
        actor=actor,
        data={
            "placement_id": placement.id,
            "previous_status": previous_status,
            "status": placement.status,
        },
    )


def notify_log_submitted(log, actor=None):
    student_name = _get_user_display_name(log.placement.student)
    admin_users = CustomUser.objects.filter(role="admin")

    create_notifications(
        recipients=[log.placement.workplace_supervisor, log.placement.academic_supervisor, *admin_users],
        title="Weekly log submitted",
        message=(
            f"Week {log.week_number} log for {student_name} at "
            f"{log.placement.company_name} has been submitted for review."
        ),
        notification_type="log_submitted",
        actor=actor,
        data={
            "log_id": log.id,
            "placement_id": log.placement_id,
            "week_number": log.week_number,
        },
    )
