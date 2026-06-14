from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation, Notification


class PlacementAdminForm(forms.ModelForm):
    class Meta:
        model = InternshipPlacement
        fields = '__all__'
        widgets = {
            'start_date': forms.DateInput(attrs={'type': 'date'}),
            'end_date': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        today = timezone.now().date()
        today_iso = today.isoformat()

        self.fields['start_date'].required = False

        if self.instance and self.instance.pk:
            self.fields['start_date'].disabled = True
            self.fields['start_date'].initial = self.instance.start_date
            self.fields['start_date'].widget.attrs['min'] = today_iso
        else:
            self.fields['start_date'].initial = today
            self.fields['start_date'].widget.attrs['min'] = today_iso
            self.fields['start_date'].disabled = False

    def clean_start_date(self):
        if self.instance and self.instance.pk:
            return self.instance.start_date

        start_date = self.cleaned_data.get('start_date')
        today = timezone.now().date()
        if start_date is None:
            return today
        if start_date < today:
            raise ValidationError('Start date cannot be before today.')
        return start_date


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
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff']
    search_fields = ['username', 'email']

class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ['placement', 'week_number', 'status', 'deadline']
    list_filter = ['status']
    search_fields = ['placement__student__username']

class PlacementAdmin(admin.ModelAdmin):
    form = PlacementAdminForm
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
class EvaluationCriteriaAdmin(admin.ModelAdmin):
    list_display = ['name', 'weight_percent', 'max_score', 'supervisor_share', 'academic_share']
    list_filter = ['name']
    search_fields = ['name', 'description']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'max_score')
        }),
        ('Weight Distribution', {
            'fields': ('weight_percent', 'supervisor_share', 'academic_share'),
            'description': 'Configure how weights are distributed between supervisor and academic evaluators. Supervisor share + Academic share must equal 100%.'
        }),
    )

admin.site.register(EvaluationCriteria, EvaluationCriteriaAdmin)
admin.site.register(Evaluation)
admin.site.register(Notification, NotificationAdmin)
