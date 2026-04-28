from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Contact', {'fields':('role', 'phone', 'department', 'staff_number', 'student_number', 'registration_number')}),
    )
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(InternshipPlacement)
admin.site.register(WeeklyLog)
admin.site.register(EvaluationCriteria)
admin.site.register(Evaluation)
