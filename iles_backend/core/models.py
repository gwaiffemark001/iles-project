from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class CustomUser(AbstractUser):
    ROLE_CHOICES =[
        ('student', 'Student Intern'),
        ('workplace_supervisor', 'Workplace Supervisor'),
        ('academic_supervisor', 'Academic Supervisor'),
        ('admin', 'Administrator'),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='student')
    phone= models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    staff_number= models.CharField(max_length=20, blank=True, null=True)
    student_number=models.CharField(max_length=20, blank=True, null=True)
    registration_number = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        return (f"{self.username},({self.role})")


class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=120, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active' ,'Active'),
        ('completed', 'Completed'),       
    ]    
    # When student is null, treat this as an "available" placement/posting.
    student =models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role':'student'},
        blank=True,
        null=True,
    )
    workplace_supervisor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='supervised_placements',limit_choices_to ={'role':'workplace_supervisor'})
    academic_supervisor = models.ForeignKey(CustomUser, on_delete= models.CASCADE, related_name='academic_placements', limit_choices_to={'role':'academic_supervisor'})
    company_name =models.CharField(max_length=200)
    company_address = models.TextField(blank=True, null=True)
    start_date =models.DateField()
    end_date =models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add =True)

    def __str__(self):
        return (f"{self.student.username} at {self.company_name}")

    def clean(self):
        """Validate placement data to prevent overlapping internships"""
        # Check for overlapping placements for the same student
        if self.student and self.start_date and self.end_date:
            overlapping_placements = InternshipPlacement.objects.filter(
                student=self.student,
                status='active',
                start_date__lte=self.end_date,
                end_date__gte=self.start_date
            ).exclude(pk=self.pk)
            
            if overlapping_placements.exists():
                raise ValidationError({
                    'start_date': 'Student cannot have overlapping active placements.',
                    'end_date': 'Student cannot have overlapping active placements.'
                })
        
        # Validate date logic
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({
                'end_date': 'End date must be after start date.'
            })

    def save(self, *args, **kwargs):
        """Override save to include validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class PlacementApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='placement_applications',
        limit_choices_to={'role': 'student'},
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = [['placement', 'student']]

    def __str__(self):
        return f"{self.student.username} -> {self.placement.company_name} ({self.status})"

class WeeklyLog(models.Model):
    STATUS_CHOICES =[
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved','Approved'),
        ('rejected', 'Rejected'),
    ]
    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='logs')
    week_number = models.PositiveIntegerField()
    activities = models.TextField()
    challenges = models.TextField(blank=True, null=True)
    learning = models.TextField(blank=True, null=True)
    status= models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    supervisor_comment = models.TextField(blank=True, null=True)
    deadline= models.DateField()
    submitted_at =models.DateTimeField(blank=True, null=True)
    reviewed_at =models.DateTimeField(blank=True, null=True)
    approved_at =models.DateTimeField(blank=True, null=True)
    rejected_at =models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit fields for tracking review actions
    reviewed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_logs',
        limit_choices_to={'role__in': ['workplace_supervisor', 'academic_supervisor']}
    )
    
    def can_edit(self):
        """Check if log can be edited based on status"""
        return self.status in ['draft', 'submitted']
    
    def is_overdue(self):
        """Check if log submission is overdue"""
        from django.utils import timezone
        return self.deadline < timezone.now().date() and self.status != 'approved'
    
    class Meta:
        unique_together =[['placement', 'week_number']]
        ordering = ['week_number']

    def __str__(self):
        return (f"Week {self.week_number}-{self.placement.student.username} ({self.status})")
    
class EvaluationCriteria(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    max_score =models.DecimalField(max_digits=5, decimal_places=2)
    weight_percent=models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"{self.name} - {self.weight_percent}% weight"
    
class Evaluation(models.Model):
    EVALUATION_TYPES = [
        ('supervisor', 'Supervisor Assessment'),
        ('academic', 'Academic Assessment'),
        ('logbook', 'Logbook Assessment'),
    ]

    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='given_evaluations')
    
    # Weighted evaluation criteria
    technical_skills = models.IntegerField(default=0, help_text="Technical competence and skills (1-5)")
    communication = models.IntegerField(default=0, help_text="Communication skills (1-5)")
    professionalism = models.IntegerField(default=0, help_text="Professionalism and work ethic (1-5)")
    initiative = models.IntegerField(default=0, help_text="Initiative and problem-solving (1-5)")
    
    # Overall computed score
    weighted_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Computed weighted score")
    
    evaluation_type = models.CharField(max_length=20, choices=EVALUATION_TYPES, default='supervisor')
    evaluated_at = models.DateTimeField(auto_now_add=True)
    
    # Weight constants for standardized scoring
    CRITERIA_WEIGHTS = {
        'technical_skills': 0.4,
        'communication': 0.3,
        'professionalism': 0.2,
        'initiative': 0.1,
    }
    
    def calculate_weighted_score(self):
        """Calculate weighted score based on criteria and weights"""
        scores = [
            self.technical_skills * self.CRITERIA_WEIGHTS['technical_skills'],
            self.communication * self.CRITERIA_WEIGHTS['communication'],
            self.professionalism * self.CRITERIA_WEIGHTS['professionalism'],
            self.initiative * self.CRITERIA_WEIGHTS['initiative'],
        ]
        return sum(scores)
    
    def save(self, *args, **kwargs):
        """Override save to calculate weighted score automatically"""
        self.weighted_score = self.calculate_weighted_score()
        super().save(*args, **kwargs)

    class Meta:
        unique_together = [['placement', 'evaluation_type']]
        ordering = ['-evaluated_at']

    def __str__(self):
        return f"{self.placement.student.username} - {self.evaluation_type}: {self.score}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("placement_created", "Placement Created"),
        ("placement_status_updated", "Placement Status Updated"),
        ("log_submitted", "Log Submitted"),
    ]

    recipient = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name="triggered_notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"
    
