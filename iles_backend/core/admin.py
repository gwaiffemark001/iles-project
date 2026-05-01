from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation, Notification

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
    ('Role & Contact', {
        'fields': (
            'role',
            'phone',
            'department',
            'staff_number',
            'student_number',
            'registration_number',
        )
    }),
)

class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ['placement', 'week_number', 'status', 'deadline']
    list_filter = ['status']
    search_fields = ['placement__student__username']

class PlacementAdmin(admin.ModelAdmin):
    list_display = ['student', 'company_name', 'status', 'start_date', 'end_date']
    list_filter = ['status']
    search_fields = ['student__username', 'company_name']


class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['recipient__username', 'title', 'message']

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(InternshipPlacement, PlacementAdmin)
admin.site.register(WeeklyLog, WeeklyLogAdmin)
admin.site.register(EvaluationCriteria)
admin.site.register(Evaluation)
admin.site.register(Notification, NotificationAdmin)
