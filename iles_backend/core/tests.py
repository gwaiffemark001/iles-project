from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import CustomUser


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

    def test_unauthenticated_cannot_access_logs(self):
        response = self.client.get('/api/logs/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)       
