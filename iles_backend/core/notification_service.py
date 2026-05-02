"""
Enhanced Notification Service (Lecture 7: Notifications and Workflow Integration)
Implements email and SMS notifications with Django signals integration
"""

from django.core.mail import send_mail
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WeeklyLog, InternshipPlacement, Notification, CustomUser
from .services import create_notification
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Enhanced notification service for email, SMS, and in-app notifications"""
    
    @staticmethod
    def send_email_notification(recipient, subject, message, html_message=None):
        """Send email notification using Django's send_mail function"""
        try:
            if not settings.EMAIL_HOST_USER:
                logger.warning("Email not configured. Skipping email notification.")
                return False
                
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Email sent successfully to {recipient.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipient.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_sms_notification(recipient, message):
        """Send SMS notification using Twilio (Lecture 7 requirement)"""
        try:
            if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
                logger.warning("Twilio not configured. Skipping SMS notification.")
                return False
                
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            message_obj = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=recipient.phone
            )
            logger.info(f"SMS sent successfully to {recipient.phone}: {message_obj.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {recipient.phone}: {str(e)}")
            return False
    
    @staticmethod
    def create_and_send_notification(recipient, title, message, notification_type, actor=None, data=None, send_email=True, send_sms=False):
        """Create in-app notification and optionally send email/SMS"""
        # Create in-app notification
        notification = create_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            actor=actor,
            data=data
        )
        
        # Send email notification
        if send_email and recipient.email:
            NotificationService.send_email_notification(
                recipient=recipient,
                subject=title,
                message=message,
                html_message=f"<h3>{title}</h3><p>{message}</p>"
            )
        
        # Send SMS notification
        if send_sms and recipient.phone:
            NotificationService.send_sms_notification(
                recipient=recipient,
                message=f"{title}: {message}"
            )
        
        return notification


# Django Signal Handlers for Workflow Integration (Lecture 7)

@receiver(post_save, sender=WeeklyLog)
def weekly_log_workflow_notification(sender, instance, created, **kwargs):
    """Trigger notifications when weekly log status changes"""
    if created:
        # New log created - notify supervisors
        if instance.placement and instance.placement.workplace_supervisor:
            NotificationService.create_and_send_notification(
                recipient=instance.placement.workplace_supervisor,
                title="New Weekly Log Submitted",
                message=f"Student {instance.placement.student.username} has submitted Week {instance.week_number} log.",
                notification_type="log_submitted",
                actor=instance.placement.student,
                data={"log_id": instance.id, "placement_id": instance.placement.id},
                send_email=True,
                send_sms=False
            )
        
        if instance.placement and instance.placement.academic_supervisor:
            NotificationService.create_and_send_notification(
                recipient=instance.placement.academic_supervisor,
                title="New Weekly Log for Review",
                message=f"Week {instance.week_number} log from {instance.placement.student.username} is ready for review.",
                notification_type="log_submitted",
                actor=instance.placement.student,
                data={"log_id": instance.id, "placement_id": instance.placement.id},
                send_email=True,
                send_sms=False
            )
    else:
        # Status updated - notify relevant parties
        if instance.status == 'reviewed':
            # Log reviewed - notify student
            NotificationService.create_and_send_notification(
                recipient=instance.placement.student,
                title="Weekly Log Reviewed",
                message=f"Your Week {instance.week_number} log has been reviewed by your supervisor.",
                notification_type="log_reviewed",
                actor=None,  # System notification
                data={"log_id": instance.id},
                send_email=True,
                send_sms=False
            )
        
        elif instance.status == 'approved':
            # Log approved - notify student
            NotificationService.create_and_send_notification(
                recipient=instance.placement.student,
                title="Weekly Log Approved! 🎉",
                message=f"Congratulations! Your Week {instance.week_number} log has been approved.",
                notification_type="log_approved",
                actor=None,  # System notification
                data={"log_id": instance.id},
                send_email=True,
                send_sms=True  # Send SMS for important approval
            )


@receiver(post_save, sender=InternshipPlacement)
def placement_workflow_notification(sender, instance, created, **kwargs):
    """Trigger notifications when placement status changes"""
    if created:
        # New placement created - notify student
        NotificationService.create_and_send_notification(
            recipient=instance.student,
            title="Internship Placement Assigned",
            message=f"You have been assigned to {instance.company_name} for your internship.",
            notification_type="placement_created",
            actor=None,  # System notification
            data={"placement_id": instance.id},
            send_email=True,
            send_sms=True
        )
        
        # Notify supervisors
        if instance.workplace_supervisor:
            NotificationService.create_and_send_notification(
                recipient=instance.workplace_supervisor,
                title="New Student Assignment",
                message=f"{instance.student.username} has been assigned to your supervision at {instance.company_name}.",
                notification_type="placement_created",
                actor=instance.student,
                data={"placement_id": instance.id},
                send_email=True,
                send_sms=False
            )
        
        if instance.academic_supervisor:
            NotificationService.create_and_send_notification(
                recipient=instance.academic_supervisor,
                title="New Academic Supervision Assignment",
                message=f"You will be the academic supervisor for {instance.student.username} at {instance.company_name}.",
                notification_type="placement_created",
                actor=instance.student,
                data={"placement_id": instance.id},
                send_email=True,
                send_sms=False
            )
    else:
        # Status updated
        if instance.status == 'active':
            # Placement activated - notify student
            NotificationService.create_and_send_notification(
                recipient=instance.student,
                title="Internship Placement Activated",
                message=f"Your internship at {instance.company_name} is now active. Good luck!",
                notification_type="placement_status_updated",
                actor=None,
                data={"placement_id": instance.id},
                send_email=True,
                send_sms=True
            )
        
        elif instance.status == 'completed':
            # Placement completed - notify all parties
            NotificationService.create_and_send_notification(
                recipient=instance.student,
                title="Internship Completed! 🎓",
                message=f"Congratulations on completing your internship at {instance.company_name}!",
                notification_type="placement_status_updated",
                actor=None,
                data={"placement_id": instance.id},
                send_email=True,
                send_sms=True
            )


def trigger_manual_notification(recipients, title, message, notification_type, actor=None, data=None):
    """Manual notification trigger for custom workflow events"""
    if isinstance(recipients, CustomUser):
        recipients = [recipients]
    
    notifications_sent = []
    for recipient in recipients:
        notification = NotificationService.create_and_send_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            actor=actor,
            data=data,
            send_email=True,
            send_sms=False  # Default to email only for manual notifications
        )
        notifications_sent.append(notification)
    
    return notifications_sent
