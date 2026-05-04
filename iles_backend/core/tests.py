from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import CustomUser, InternshipPlacement, Notification, WeeklyLog


class AuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='teststudent',
            password='testpass123',
            role='student'
        )

    def test_login_with_valid_credentials(self):
        response = self.client.post('/api/token/', {
            'username': 'teststudent',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_invalid_credentials(self):
        response = self.client.post('/api/token/', {
            'username': 'teststudent',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_authentication(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_access_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'teststudent')
        self.assertEqual(response.data['role'], 'student')

class WeeklyLogTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.student = CustomUser.objects.create_user(
            username='student1',
            password='pass123',
            role='student'
        )
        self.supervisor = CustomUser.objects.create_user(
            username='supervisor1',
            password='pass123',
            role='workplace_supervisor'
        )

    def test_logs_endpoint_requires_authentication(self):
        response = self.client.get('/api/logs/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_can_access_logs(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_cannot_register_as_student(self):
        response = self.client.post('/api/register/', {
            'username': 'newuser',
            'password': 'pass123',
            'role': 'student'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class PermissionTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.student = CustomUser.objects.create_user(
            username='student2',
            password='pass123',
            role='student'
        )
        self.admin = CustomUser.objects.create_user(
            username='admin1',
            password='pass123',
            role='admin'
        )

    def test_student_cannot_create_placement(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/placements/', {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_placements(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/placements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_access_users(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/users/?role=student')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['role'], 'student')

    def test_student_cannot_access_users(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_cannot_create_duplicate_active_placement_for_student(self):
        workplace_supervisor = CustomUser.objects.create_user(
            username='supervisor-dup',
            password='pass123',
            role='workplace_supervisor'
        )
        academic_supervisor = CustomUser.objects.create_user(
            username='academic-dup',
            password='pass123',
            role='academic_supervisor'
        )
        InternshipPlacement.objects.create(
            student=self.student,
            workplace_supervisor=workplace_supervisor,
            academic_supervisor=academic_supervisor,
            company_name='Existing Company',
            company_address='Kampala',
            start_date='2026-01-01',
            end_date='2026-03-01',
            status='active',
        )

        other_workplace_supervisor = CustomUser.objects.create_user(
            username='supervisor-new',
            password='pass123',
            role='workplace_supervisor'
        )
        other_academic_supervisor = CustomUser.objects.create_user(
            username='academic-new',
            password='pass123',
            role='academic_supervisor'
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/placements/', {
            'student_id': self.student.id,
            'workplace_supervisor_id': other_workplace_supervisor.id,
            'academic_supervisor_id': other_academic_supervisor.id,
            'company_name': 'New Company',
            'company_address': 'Jinja',
            'start_date': '2026-04-01',
            'end_date': '2026-06-01',
            'status': 'pending',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id', response.data)

    def test_unauthenticated_cannot_access_logs(self):
        response = self.client.get('/api/logs/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NotificationWorkflowTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = CustomUser.objects.create_user(
            username='admin-notify',
            password='pass123',
            role='admin'
        )
        self.student = CustomUser.objects.create_user(
            username='student-notify',
            password='pass123',
            role='student'
        )
        self.workplace_supervisor = CustomUser.objects.create_user(
            username='workplace-notify',
            password='pass123',
            role='workplace_supervisor'
        )
        self.academic_supervisor = CustomUser.objects.create_user(
            username='academic-notify',
            password='pass123',
            role='academic_supervisor'
        )

    def test_placement_creation_creates_notifications(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/placements/', {
            'student_id': self.student.id,
            'workplace_supervisor_id': self.workplace_supervisor.id,
            'academic_supervisor_id': self.academic_supervisor.id,
            'company_name': 'Makerere Innovation Hub',
            'company_address': 'Kampala',
            'start_date': '2026-05-01',
            'end_date': '2026-07-31',
            'status': 'pending',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notification.objects.filter(notification_type='placement_created').count(), 9)

    def test_placement_status_update_creates_notifications(self):
        placement = InternshipPlacement.objects.create(
            student=self.student,
            workplace_supervisor=self.workplace_supervisor,
            academic_supervisor=self.academic_supervisor,
            company_name='Makerere Innovation Hub',
            company_address='Kampala',
            start_date='2026-05-01',
            end_date='2026-07-31',
            status='pending',
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.put(f'/api/placements/{placement.id}/', {
            'student_id': self.student.id,
            'workplace_supervisor_id': self.workplace_supervisor.id,
            'academic_supervisor_id': self.academic_supervisor.id,
            'company_name': 'Makerere Innovation Hub',
            'company_address': 'Kampala',
            'start_date': '2026-05-01',
            'end_date': '2026-07-31',
            'status': 'active',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(notification_type='placement_status_updated').count(), 5)

    def test_log_submission_creates_notifications(self):
        placement = InternshipPlacement.objects.create(
            student=self.student,
            workplace_supervisor=self.workplace_supervisor,
            academic_supervisor=self.academic_supervisor,
            company_name='Makerere Innovation Hub',
            company_address='Kampala',
            start_date='2026-05-01',
            end_date='2026-07-31',
            status='active',
        )
        log = WeeklyLog.objects.create(
            placement=placement,
            week_number=1,
            activities='Implemented API integration',
            challenges='None',
            learning='Learned DRF serializers',
            status='draft',
            deadline='2026-05-07',
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.put(f'/api/logs/{log.id}/submit/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recipients = set(
            Notification.objects.filter(notification_type='log_submitted')
            .values_list('recipient__role', flat=True)
        )
        self.assertEqual(recipients, {'admin', 'workplace_supervisor', 'academic_supervisor'})

    def test_user_can_list_and_mark_notifications_as_read(self):
        Notification.objects.create(
            recipient=self.student,
            actor=self.admin,
            title='Placement assigned',
            message='You have a new placement.',
            notification_type='placement_created',
        )

        self.client.force_authenticate(user=self.student)
        list_response = self.client.get('/api/notifications/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)

        notification_id = list_response.data[0]['id']
        read_response = self.client.put(f'/api/notifications/{notification_id}/read/')
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertTrue(read_response.data['is_read'])
