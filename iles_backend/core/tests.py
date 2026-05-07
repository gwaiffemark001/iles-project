from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import CustomUser, Evaluation, EvaluationCriteria, EvaluationItem, InternshipPlacement, Notification, WeeklyLog
from datetime import timedelta
from django.utils import timezone


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
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['role'], 'student')

    def test_student_cannot_access_users(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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


class WeeklyLogPolicyTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.student = CustomUser.objects.create_user(
            username='student-policy',
            password='pass123',
            role='student'
        )
        self.workplace_supervisor = CustomUser.objects.create_user(
            username='workplace-policy',
            password='pass123',
            role='workplace_supervisor'
        )
        self.academic_supervisor = CustomUser.objects.create_user(
            username='academic-policy',
            password='pass123',
            role='academic_supervisor'
        )
        self.placement = InternshipPlacement.objects.create(
            student=self.student,
            workplace_supervisor=self.workplace_supervisor,
            academic_supervisor=self.academic_supervisor,
            company_name='Policy Co',
            company_address='Kampala',
            start_date='2026-05-01',
            end_date='2026-06-30',
            status='active',
        )

    def test_weekly_log_deadline_is_computed_from_placement_start(self):
        log = WeeklyLog.objects.create(
            placement=self.placement,
            week_number=1,
            activities='Work',
            status='draft',
        )
        self.assertEqual(str(log.deadline), '2026-05-07')

    def test_student_cannot_submit_after_deadline(self):
        # Keep placement active, but set week 1 deadline in the past.
        self.placement.start_date = timezone.now().date() - timedelta(days=60)
        self.placement.end_date = timezone.now().date() + timedelta(days=60)
        self.placement.save()

        log = WeeklyLog.objects.create(
            placement=self.placement,
            week_number=1,
            activities='Work',
            status='draft',
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.put(f'/api/logs/{log.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot submit after deadline', str(response.data))

    def test_student_cannot_edit_approved_log(self):
        approved_log = WeeklyLog.objects.create(
            placement=self.placement,
            week_number=2,
            activities='Done',
            status='approved',
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.put(f'/api/logs/{approved_log.id}/', {
            'placement_id': self.placement.id,
            'week_number': 2,
            'activities': 'Changed',
            'status': 'draft',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_create_duplicate_weekly_log(self):
        WeeklyLog.objects.create(
            placement=self.placement,
            week_number=3,
            activities='Existing',
            status='draft',
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/logs/', {
            'placement_id': self.placement.id,
            'week_number': 3,
            'activities': 'Duplicate',
            'status': 'draft',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EvaluationPolicyTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.student = CustomUser.objects.create_user(
            username='student-eval',
            password='pass123',
            role='student'
        )
        self.workplace_supervisor = CustomUser.objects.create_user(
            username='workplace-eval',
            password='pass123',
            role='workplace_supervisor'
        )
        self.academic_supervisor = CustomUser.objects.create_user(
            username='academic-eval',
            password='pass123',
            role='academic_supervisor'
        )
        self.placement = InternshipPlacement.objects.create(
            student=self.student,
            workplace_supervisor=self.workplace_supervisor,
            academic_supervisor=self.academic_supervisor,
            company_name='Eval Co',
            company_address='Kampala',
            start_date='2026-05-01',
            end_date='2026-06-30',
            status='active',
        )
        WeeklyLog.objects.create(
            placement=self.placement,
            week_number=1,
            activities='Submitted work',
            status='approved',
        )
        self.technical = EvaluationCriteria.objects.create(name='Technical Skills', max_score=100, weight_percent=34)
        self.communication = EvaluationCriteria.objects.create(name='Communication', max_score=100, weight_percent=33)
        self.professionalism = EvaluationCriteria.objects.create(name='Professionalism', max_score=100, weight_percent=33)

    def test_workplace_supervisor_score_uses_fixed_weights(self):
        self.client.force_authenticate(user=self.workplace_supervisor)
        response = self.client.post('/api/evaluations/', {
            'placement_id': self.placement.id,
            'week_number': 1,
            'evaluation_type': 'supervisor',
            'items': [
                {'criteria_id': self.technical.id, 'score': 80},
                {'criteria_id': self.communication.id, 'score': 70},
                {'criteria_id': self.professionalism.id, 'score': 90},
            ],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expected_score = (80 * 0.4) + (70 * 0.3) + (90 * 0.3)
        self.assertAlmostEqual(float(response.data['weighted_score']), expected_score, places=1)

    def test_cannot_create_evaluation_without_weekly_log(self):
        self.client.force_authenticate(user=self.workplace_supervisor)
        response = self.client.post('/api/evaluations/', {
            'placement_id': self.placement.id,
            'week_number': 2,
            'evaluation_type': 'supervisor',
            'items': [
                {'criteria_id': self.technical.id, 'score': 80},
                {'criteria_id': self.communication.id, 'score': 70},
                {'criteria_id': self.professionalism.id, 'score': 90},
            ],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No weekly log exists for this placement and week', str(response.data))

    def test_cannot_create_duplicate_evaluation_for_same_week(self):
        Evaluation.objects.create(
            placement=self.placement,
            evaluator=self.workplace_supervisor,
            week_number=1,
            evaluation_type='supervisor',
            weighted_score=79,
        )

        self.client.force_authenticate(user=self.workplace_supervisor)
        response = self.client.post('/api/evaluations/', {
            'placement_id': self.placement.id,
            'week_number': 1,
            'evaluation_type': 'supervisor',
            'items': [
                {'criteria_id': self.technical.id, 'score': 80},
                {'criteria_id': self.communication.id, 'score': 70},
                {'criteria_id': self.professionalism.id, 'score': 90},
            ],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

