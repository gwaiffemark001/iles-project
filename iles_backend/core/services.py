"""
Notification service module for managing system notifications.

Provides functions to create and send notifications to users for various
system events (placements, evaluations, log submissions, etc.).
"""
from .models import CustomUser, Notification

def _get_user_display_name(user):
    """Get user's display name (full name or username)."""
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username

def _dedupe_users(users):
    """Remove duplicate users from a list, preserving order."""
    unique_users = []
    seen_ids = set()

    for user in users:
        if not user or user.pk in seen_ids:
            continue
        unique_users.append(user)
        seen_ids.add(user.pk)

    return unique_users


def create_notification(recipient, title, message, notification_type, actor=None, data=None):
    """
    Create and save a single notification.
    
    Args:
        recipient: User receiving the notification
        title: Notification title
        message: Notification message
        notification_type: Type of notification (placement_created, log_submitted, etc.)
        actor: User who triggered the notification
        data: Optional metadata dict with additional notification data
    
    Returns:
        Notification instance or None if recipient is None
    """
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
    """
    Create and save notifications for multiple recipients.
    
    Uses bulk_create for efficiency. Automatically deduplicates recipients.
    
    Args:
        recipients: List of User instances
        title: Notification title
        message: Notification message
        notification_type: Type of notification
        actor: User who triggered the notification
        data: Optional metadata dict with additional notification data
    
    Returns:
        List of Notification instances created
    """
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
    """
    Create notifications when a new internship placement is created.
    
    Notifies student, workplace supervisor, and academic supervisor.
    """
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
    """
    Notify all stakeholders when placement status changes.
    
    Sent to student, workplace supervisor, and academic supervisor.
    """
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
    """
    Notify supervisors and admins when a weekly log is submitted for review.
    
    Sent to workplace supervisor, academic supervisor, and all admins.
    """
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


def notify_evaluation_status_changed(evaluation, actor=None, created=False, week_number=None):
    """
    Notify stakeholders when an evaluation is submitted or updated.
    
    Excludes the actor (person who made the change) from recipients.
    Sent to student, workplace supervisor, and academic supervisor.
    """
    placement = evaluation.placement
    student = placement.student
    workplace_supervisor = placement.workplace_supervisor
    academic_supervisor = placement.academic_supervisor
    recipients = [student, workplace_supervisor, academic_supervisor]

    if actor is not None:
        recipients = [user for user in recipients if user and user.pk != actor.pk]

    notification_type = "evaluation_submitted" if created else "evaluation_updated"
    title = "Weekly evaluation submitted" if created else "Weekly evaluation updated"
    actor_label = _get_user_display_name(actor) if actor else "A supervisor"
    week_label = week_number if week_number is not None else "N/A"
    message = (
        f"{actor_label} { 'submitted' if created else 'updated' } week {week_label} "
        f"evaluation for {placement.company_name}."
    )

    create_notifications(
        recipients=recipients,
        title=title,
        message=message,
        notification_type=notification_type,
        actor=actor,
        data={
            "evaluation_id": evaluation.id,
            "placement_id": placement.id,
            "week_number": week_number,
            "evaluation_type": evaluation.evaluation_type,
        },
    )
