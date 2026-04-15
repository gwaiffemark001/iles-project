from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Contact', {'fields': ('role', 'phone')}),
    )
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff']
    search_fields = ['username', 'email']

class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ['placement', 'week_number', 'status', 'deadline']
    list_filter = ['status']
    search_fields = ['placement__student__username']

class PlacementAdmin(admin.ModelAdmin):
    list_display = ['student', 'company_name', 'status', 'start_date', 'end_date']
    list_filter = ['status']
    search_fields = ['student__username', 'company_name']

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(InternshipPlacement, PlacementAdmin)
admin.site.register(WeeklyLog, WeeklyLogAdmin)
admin.site.register(EvaluationCriteria)
admin.site.register(Evaluation)