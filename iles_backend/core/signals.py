from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CustomUser, UserProfile
from .models import InternshipPlacement, WeeklyLog
from .notification_service import weekly_log_workflow_notification, placement_workflow_notification


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        instance.profile.save()


# Import and register the enhanced notification signal handlers
@receiver(post_save, sender='core.WeeklyLog')
def weekly_log_notification_handler(sender, instance, created, **kwargs):
    """Enhanced weekly log notifications with email/SMS integration"""
    weekly_log_workflow_notification(sender, instance, created, **kwargs)


@receiver(post_save, sender=InternshipPlacement)
def placement_notification_handler(sender, instance, created, **kwargs):
    placement_workflow_notification(sender, instance, created, **kwargs)