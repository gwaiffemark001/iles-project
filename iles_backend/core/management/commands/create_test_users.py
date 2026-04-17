from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import InternshipPlacement

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for the internship system'

    def handle(self, *args, **options):
        # Create test users
        users_data = [
            {
                'username': 'student1',
                'email': 'student1@example.com',
                'password': 'password123',
                'role': 'student',
                'first_name': 'John',
                'last_name': 'Doe',
                'department': 'Computer Science',
                'student_number': 'STU001'
            },
            {
                'username': 'workplace_supervisor',
                'email': 'supervisor@company.com',
                'password': 'password123',
                'role': 'workplace_supervisor',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'department': 'IT Department',
                'staff_number': 'SUP001'
            },
            {
                'username': 'academic_supervisor',
                'email': 'academic@university.edu',
                'password': 'password123',
                'role': 'academic_supervisor',
                'first_name': 'Dr. Michael',
                'last_name': 'Johnson',
                'department': 'Computer Science',
                'staff_number': 'ACA001'
            },
            {
                'username': 'admin',
                'email': 'admin@iles.com',
                'password': 'password123',
                'role': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'department': 'Administration'
            }
        ]

        created_users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'department': user_data['department'],
                    'staff_number': user_data.get('staff_number'),
                    'student_number': user_data.get('student_number'),
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                created_users.append(user)
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {user.username} ({user.role})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User {user.username} already exists')
                )

        # Create a test placement if users exist
        try:
            student = User.objects.get(username='student1')
            workplace_supervisor = User.objects.get(username='workplace_supervisor')
            academic_supervisor = User.objects.get(username='academic_supervisor')

            placement, created = InternshipPlacement.objects.get_or_create(
                student=student,
                defaults={
                    'workplace_supervisor': workplace_supervisor,
                    'academic_supervisor': academic_supervisor,
                    'company_name': 'Tech Solutions Inc.',
                    'company_address': '123 Business St, City, Country',
                    'start_date': '2024-01-15',
                    'end_date': '2024-06-15',
                    'status': 'active'
                }
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS('Created test internship placement')
                )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.WARNING('Could not create placement - users not found')
            )

        self.stdout.write(
            self.style.SUCCESS('\nTest users created! Login credentials:')
        )
        for user_data in users_data:
            self.stdout.write(
                f'  {user_data["username"]} - password123 ({user_data["role"]})'
            )