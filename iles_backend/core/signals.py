from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile
from .models import InternshipPlacement, WeeklyLog
from .notification_service import weekly_log_workflow_notification, placement_workflow_notification
from django.db.models.signals import post_migrate
import logging

logger = logging.getLogger(__name__)

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

# split commit: feat(signals): add user profile creation signal handler


# The old production-only post_migrate enforcement below was unsafe because it
# deactivated all active users every time migrations ran in production.
# That could flip previously activated accounts back to inactive on deploy.
#
# Account activation is already handled explicitly in the registration/activation
# flow, so this bulk deactivation is unnecessary and harmful.
#
# @receiver(post_migrate)
# def enforce_inactive_users(sender, **kwargs):
#     """Ensure all users are inactive by default after migrations in production.
#
#     In development (DEBUG=True), users remain active.
#     In production (DEBUG=False), enforce manual activation for every account.
#     """
#     from django.conf import settings
#     from django.contrib.auth import get_user_model
#     
#     if settings.DEBUG:
#         logger.info('Post-migrate: DEBUG mode active, skipping inactive-by-default enforcement')
#         return
#     
#     try:
#         User = get_user_model()
#         updated = User.objects.filter(is_active=True).update(is_active=False)
#         if updated:
#             logger.info('Post-migrate: set %d existing users to inactive (production)', updated)
#     except Exception:
#         logger.exception('Failed to enforce inactive-by-default policy')


@receiver(post_save, sender=CustomUser)
def set_superuser_role(sender, instance, created, **kwargs):
    """Automatically set superuser role to 'admin'.
    
    When a superuser is created, ensure their role is set to 'admin'
    to maintain consistency with role-based access control.
    """
    if instance.is_superuser and instance.role != 'admin':
        instance.role = 'admin'
        instance.save(update_fields=['role'])
        logger.info(f'Set superuser {instance.username} role to admin')
