from django.db import models
from decimal import Decimal
from django.contrib.auth.models import AbstractUser

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
        student_username = self.student.username if self.student else "Unassigned"
        return (f"{student_username} at {self.company_name}")


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together =[['placement', 'week_number']]
        ordering = ['week_number']

    def __str__(self):
        student_username = self.placement.student.username if self.placement.student else "Unknown"
        return (f"Week {self.week_number}-{student_username} ({self.status})")
    
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
    score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    evaluation_type = models.CharField(max_length=20, choices=EVALUATION_TYPES, default='supervisor')
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['placement', 'evaluation_type']]
        ordering = ['-evaluated_at']

    def __str__(self):
        student_username = self.placement.student.username if self.placement.student else "Unknown"
        return f"{student_username} - {self.evaluation_type}: {self.score}"

    def calculate_weighted_score(self):
        """
        Calculate the evaluation score from related EvaluationItem entries.
        The formula used is: for each criteria, contribution = (item.score / criteria.max_score) * criteria.weight_percent
        The method returns the aggregated percent (e.g. 85.5) and does not modify the model unless `save_calculated` is True.
        """
        try:
            # Use the declared related_name from EvaluationItem model
            # getattr handles cases where the relation may not be initialized
            items_qs = getattr(self, 'evaluation_items', None)
            if items_qs is None:
                items_qs = []
            else:
                items_qs = items_qs.all() if hasattr(items_qs, 'all') else []
        except (AttributeError, Exception):
            # fallback to an empty iterable if the relation isn't available
            items_qs = []

        total = Decimal('0')
        for item in items_qs:
            crit = item.criteria
            try:
                # Avoid division by zero
                if crit.max_score and crit.max_score > 0:
                    contribution = (Decimal(str(item.score)) / Decimal(str(crit.max_score))) * Decimal(str(crit.weight_percent))
                else:
                    contribution = Decimal('0')
            except Exception:
                contribution = Decimal('0')
            total += Decimal(str(contribution))

        # total represents percentage points according to criteria weight_percent (which should sum to 100)
        return float(round(total, 2))

    def update_score_from_items(self):
        """Recalculate `score` from EvaluationItem entries and save the model."""
        calculated = self.calculate_weighted_score()
        self.score = calculated
        self.save(update_fields=['score'])


class EvaluationItem(models.Model):
    """Stores a per-criteria score for an Evaluation."""
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE, related_name='evaluation_items')
    criteria = models.ForeignKey(EvaluationCriteria, on_delete=models.PROTECT, related_name='evaluation_items')
    score = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0'))

    class Meta:
        unique_together = [['evaluation', 'criteria']]

    def __str__(self):
        return f"{self.evaluation} - {self.criteria.name}: {self.score}"


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
    
