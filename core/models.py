from django.contrib.auth.models import AbstractUser 
from django.db import models 
 
 
# ── MODEL 1: Custom User ────────────────────────────────── 
class CustomUser(AbstractUser): 
    ROLE_CHOICES = [ 
        ('student', 'Student Intern'), 
        ('workplace_supervisor', 'Workplace Supervisor'), 
        ('academic_supervisor', 'Academic Supervisor'), 
        ('admin', 'Internship Administrator'), 
    ] 
    role = models.CharField( 
        max_length=30, 
        choices=ROLE_CHOICES, 
        default='student' 
    ) 
    phone = models.CharField(max_length=15, blank=True) 
    profile_picture = models.ImageField( 
        upload_to='profiles/', 
        blank=True, 
        null=True 
    ) 
 
    def __str__(self): 
        return f'{self.username} ({self.role})' 
 
 
# ── MODEL 2: Internship Placement ───────────────────────── 
class InternshipPlacement(models.Model): 
    STATUS_CHOICES = [ 
        ('pending', 'Pending'), 
        ('active', 'Active'), 
        ('completed', 'Completed'), 
    ] 
    student = models.ForeignKey( 
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='placements', 
        limit_choices_to={'role': 'student'} 
    ) 
    workplace_supervisor = models.ForeignKey( 
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='supervised_placements', 
        limit_choices_to={'role': 'workplace_supervisor'} 
    ) 
    academic_supervisor = models.ForeignKey( 
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='academic_placements', 
        limit_choices_to={'role': 'academic_supervisor'} 
    ) 
    company_name = models.CharField(max_length=200) 
    company_address = models.TextField(blank=True) 
    start_date = models.DateField() 
    end_date = models.DateField() 
    status = models.CharField( 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending' 
    ) 
    created_at = models.DateTimeField(auto_now_add=True) 
 
    def __str__(self): 
        return f'{self.student.username} at {self.company_name}' 
 
 
# ── MODEL 3: Weekly Log ──────────────────────────────────── 
class WeeklyLog(models.Model): 
    STATUS_CHOICES = [ 
        ('draft', 'Draft'), 
        ('submitted', 'Submitted'), 
        ('reviewed', 'Reviewed'), 
        ('approved', 'Approved'), 
    ] 
    placement = models.ForeignKey( 
        InternshipPlacement, 
        on_delete=models.CASCADE, 
        related_name='logs' 
    ) 
    week_number = models.PositiveIntegerField() 
    activities = models.TextField() 
    challenges = models.TextField(blank=True) 
    learning = models.TextField(blank=True) 
    status = models.CharField( 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft' 
    ) 
    supervisor_comment = models.TextField(blank=True) 
    deadline = models.DateField() 
    submitted_at = models.DateTimeField(null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True) 
    updated_at = models.DateTimeField(auto_now=True) 
 
    class Meta: 
        unique_together = [['placement', 'week_number']] 
 
    def __str__(self): 
        return f'Week {self.week_number} log for {self.placement}' 
 
 
# ── MODEL 4: Evaluation Criteria ─────────────────────────── 
class EvaluationCriteria(models.Model): 
    name = models.CharField(max_length=100) 
    description = models.TextField(blank=True) 
    max_score = models.DecimalField(max_digits=5, decimal_places=2) 
    weight_percent = models.DecimalField(max_digits=5, 
decimal_places=2) 
 
    def __str__(self): 
        return f'{self.name} (weight: {self.weight_percent}%)' 
 
 
# ── MODEL 5: Evaluation ──────────────────────────────────── 
class Evaluation(models.Model): 
    placement = models.ForeignKey( 
        InternshipPlacement, 
        on_delete=models.CASCADE, 
        related_name='evaluations' 
    ) 
    evaluator = models.ForeignKey( 
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='given_evaluations' 
    ) 
    supervisor_score = models.DecimalField( 
        max_digits=5, decimal_places=2, default=0 
    ) 
    academic_score = models.DecimalField( 
        max_digits=5, decimal_places=2, default=0 
    ) 
    logbook_score = models.DecimalField( 
        max_digits=5, decimal_places=2, default=0 
    ) 
    total_score = models.DecimalField( 
        max_digits=5, decimal_places=2, blank=True, null=True 
    ) 
    evaluated_at = models.DateTimeField(auto_now_add=True) 
 
    class Meta: 
        unique_together = [['placement', 'evaluator']] 
 
    def save(self, *args, **kwargs): 
        # Auto-calculate weighted total score 
        # 40% supervisor + 30% academic + 30% logbook 
        self.total_score = ( 
            self.supervisor_score * 40 / 100 + 
            self.academic_score   * 30 / 100 + 
            self.logbook_score    * 30 / 100 
        ) 
        super().save(*args, **kwargs) 
 
    def __str__(self): 
        return f'Evaluation for {self.placement} — Total: {self.total_score}'