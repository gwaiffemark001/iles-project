from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class CustomUser(AbstractUser):
    # Choices for roles 
    ROLE_CHOICES = [
        ('student', 'Student Intern'),
        ('workplace_sup', 'Workplace Supervisor'),
        ('academic_sup', 'Academic Supervisor'),
        ('admin', 'Internship Admin'),
    ]
    
    # Fields
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student' 
    )
    phone = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True 
    )
    bio = models.TextField(
        max_length=500,
        blank=True
    )
    
    # Method to display user name and role in admin interface
    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

class InternshipPlacement(models.Model):
    pass
  
  