from django.db import models
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

    def __str__(self):
        return (f"{self.username},({self.role})")

class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active' ,'Active'),
        ('completed', 'Completed'),       
    ]    
    student =models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='placements', limit_choices_to={'role':'student'})
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
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    evaluation_type = models.CharField(max_length=20, choices=EVALUATION_TYPES, default='supervisor')
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['placement', 'evaluation_type']]
        ordering = ['-evaluated_at']

    def __str__(self):
        return f"{self.placement.student.username} - {self.evaluation_type}: {self.score}"