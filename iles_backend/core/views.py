# ILES Backend API Views
# Built by Mugabe Gideon
# Endpoints: WeeklyLog, Placement, Evaluation, Auth, Profile, Supervisor Workflow
from django.db import models
from django.db.models import Count
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import os
import re
import socket
import smtplib
from django.utils import timezone
from django.core.validators import EmailValidator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.exceptions import ValidationError
import logging
from django.conf import settings
from .models import (
    CustomUser,
    Evaluation,
    EvaluationCriteria,
    InternshipPlacement,
    Notification,
    PlacementApplication,
    UserProfile,
    WeeklyLog,
    ChatMessage,
)
from .serializers import (
    CustomUserSerializer,
    EvaluationCriteriaSerializer,
    EvaluationSerializer,
    InternshipPlacementSerializer,
    NotificationSerializer,
    PlacementApplicationSerializer,
    UserProfileSerializer,
    WeeklyLogSerializer,
    ChatMessageSerializer,
)

EMAIL_VALIDATOR = EmailValidator()


def normalize_phone_number(phone):
    if phone is None:
        return None
    raw = re.sub(r'[^0-9]', '', str(phone or ''))
    if not raw:
        return None
    if not re.fullmatch(r'[1-9]\d{7,14}', raw):
        raise ValidationError(
            'Phone number must include a country code and contain 8 to 15 digits.'
        )
    return raw


def validate_name_field(value, field_name):
    if not value:
        return ''
    if re.search(r'\s', value):
        raise ValidationError(f'{field_name} must not contain spaces.')
    if not re.fullmatch(r"[A-Za-z'-]+", value):
        raise ValidationError(
            f'{field_name} may only contain letters, hyphens, and apostrophes.'
        )
    return value


def verify_email_domain_exists(email):
    try:
        domain = email.split('@', 1)[1]
    except IndexError:
        return False
    try:
        socket.getaddrinfo(domain, None)
        return True
    except OSError:
        return False


def verify_email_exists(email):
    """
    Verify email exists by checking format, domain, and SMTP mailbox verification.
    """
    try:
        EMAIL_VALIDATOR(email)
    except ValidationError:
        logger.debug(f'Email format invalid: {email}')
        return False

    if not verify_email_domain_exists(email):
        logger.debug(f'Email domain not found: {email}')
        return False

    # Attempt SMTP verification with aggressive timeout to prevent hanging
    try:
        domain = email.split('@', 1)[1]
        # Use shorter timeout (5 seconds) to prevent connection hanging
        with smtplib.SMTP(timeout=5) as smtp:
            smtp.connect(domain, timeout=5)
            smtp.ehlo_or_helo_if_needed()
            smtp.mail('verify@iles-project.com')
            code, response = smtp.rcpt(email)
            is_valid = code in (250, 251)
            if is_valid:
                logger.debug(f'Email verified via SMTP: {email}')
            else:
                logger.debug(f'SMTP RCPT returned code {code} for {email}')
            return is_valid
    except (smtplib.SMTPServerDisconnected, smtplib.SMTPException) as e:
        logger.warning(f'SMTP verification failed for {email}: {str(e)[:100]}')
        return False
    except (OSError, socket.timeout, ConnectionRefusedError, ConnectionError) as e:
        logger.warning(f'Network error during email verification for {email}: {str(e)[:100]}')
        return False
    except Exception as e:
        logger.error(f'Unexpected error verifying email {email}: {str(e)[:100]}')
        return False
from .notification_service import NotificationService
from .gmail_oauth2 import send_email_via_gmail_api, get_gmail_oauth2_setup_instructions

logger = logging.getLogger(__name__)
from .services import (
    notify_evaluation_status_changed,
    notify_log_submitted,
    notify_placement_created,
    notify_placement_status_updated,
)

class WeeklyLogListView(APIView):
    """
    API endpoint for managing weekly logs.
    
    GET /api/logs/ - Retrieve logs filtered by user role and optional status/week parameters
    POST /api/logs/ - Create a new weekly log (students only)
    
    Role-based access:
    - Admin: Can view all logs
    - Workplace/Academic Supervisors: Can view their supervised placements' logs
    - Students: Can view their own placement logs
    """
    permission_classes =[IsAuthenticated]   

    def get(self, request):
        logs = WeeklyLog.objects.select_related(
            'placement',
            'placement__student',
            'placement__workplace_supervisor',
            'placement__academic_supervisor',
        )

        if request.user.role == 'admin':
            pass
        elif request.user.role == 'workplace_supervisor':
            logs = logs.filter(
                placement__workplace_supervisor=request.user
            )
        elif request.user.role == 'academic_supervisor':
            logs = logs.filter(
                placement__academic_supervisor=request.user
            )
        else:
            logs = logs.filter(placement__student=request.user)

        # Allow filtering by status: /api/logs/?status=submitted
        status_filter = request.query_params.get('status')
        if status_filter:
            logs = logs.filter(status=status_filter)

        # Allow filtering by week: /api/logs/?week=3
        week_filter = request.query_params.get('week')
        if week_filter:
            logs = logs.filter(week_number=week_filter)

        serializer = WeeklyLogSerializer(logs, many=True)
        return Response(serializer.data) 
    
    def post(self, request):
        serializer = WeeklyLogSerializer(data=request.data)
        if serializer.is_valid():
            placement = serializer.validated_data.get('placement')
            week_number = serializer.validated_data.get('week_number')
            if placement and placement.student != request.user:
                return Response(
                    {'error': 'You can only create logs for your own placement'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if placement and placement.get_computed_status() == 'completed':
                return Response(
                    {'error': 'Cannot create a weekly log for a completed placement.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if placement and placement.get_computed_status() == 'pending' and serializer.validated_data.get('status') == 'submitted':
                return Response(
                    {'error': 'Cannot submit a weekly log for a pending placement.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if WeeklyLog.objects.filter(placement=placement, week_number=week_number).select_related('placement').exists():
                return Response(
                    {'error': 'A weekly log for this placement and week already exists.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            deadline = WeeklyLog(placement=placement, week_number=week_number).calculate_deadline()
            if serializer.validated_data.get('status') == 'submitted' and deadline and timezone.now().date() > deadline:
                return Response(
                    {'error': 'Cannot submit after deadline'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log = serializer.save()
            # Set submitted_at timestamp if status is submitted
            if log.status == 'submitted':
                log.submitted_at = timezone.now()
                log.save()
                notify_log_submitted(log, actor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class WeeklyLogDetailView(APIView):
    """
    GET /api/logs/<pk>/ - Get a single log
    PUT /api/logs/<pk>/ -Update a log
    DELETE /api/logs/<pk>/ - Delete a draft log
    """
    permission_classes = [IsAuthenticated]

    def _get_log_for_user(self, request, pk):
        if request.user.role == 'admin':
            return WeeklyLog.objects.get(pk=pk)

        if request.user.role == 'workplace_supervisor':
            return WeeklyLog.objects.get(pk=pk, placement__workplace_supervisor=request.user)

        if request.user.role == 'academic_supervisor':
            return WeeklyLog.objects.get(pk=pk, placement__academic_supervisor=request.user)

        return WeeklyLog.objects.get(pk=pk, placement__student=request.user)

    def get(self, request, pk):
        try:
            log = self._get_log_for_user(request, pk)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)

    def put(self, request, pk):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can update weekly logs'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            log = WeeklyLog.objects.get(pk=pk, placement__student=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log Not found'}, status=status.HTTP_404_NOT_FOUND)

        if log.status != 'draft':
            return Response(
                {'error': 'Only draft logs can be updated'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = WeeklyLogSerializer(log, data=request.data)
                                
        if serializer.is_valid():
            placement = serializer.validated_data.get('placement', log.placement)
            if placement.student != request.user:
                return Response(
                    {'error': 'You can only update logs for your own placement'},
                    status=status.HTTP_403_FORBIDDEN
                )

            status_value = serializer.validated_data.get('status', log.status)
            deadline = log.calculate_deadline()
            if status_value == 'submitted' and deadline and timezone.now().date() > deadline:
                return Response({'error': 'Cannot submit after deadline'}, status=status.HTTP_400_BAD_REQUEST)
            if status_value == 'submitted' and placement.get_computed_status() == 'pending':
                return Response(
                    {'error': 'Cannot submit a weekly log for a pending placement.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if status_value == 'submitted' and placement.get_computed_status() == 'completed':
                return Response(
                    {'error': 'Cannot submit a weekly log for a completed placement.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        

            previous_status = log.status
            serializer.save(
                submitted_at=timezone.now() if status_value == 'submitted' else None
            )
            if previous_status != 'submitted' and status_value == 'submitted':
                log.refresh_from_db()
                notify_log_submitted(log, actor=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can delete weekly logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            log = WeeklyLog.objects.get(pk=pk, placement__student=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
        if log.status != 'draft':
            return Response({'error': 'Only draft logs can be deleted'}, status=status.HTTP_400_BAD_REQUEST)
        log.delete()
        return Response({'message': 'Log deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

class InternshipPlacementListView(APIView):
    """
    API endpoint for internship placements management.
    
    GET /api/placements/ - List placements filtered by user role and supervisory relationships
    POST /api/placements/ - Create new placement (admin only)
    
    Role-based filtering:
    - Admin: Can view all placements
    - Workplace/Academic Supervisors: Can view their assigned placements
    - Students: Can view their own placement
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        placements = InternshipPlacement.objects.select_related(
            'student',
            'workplace_supervisor',
            'academic_supervisor',
        )

        if request.user.role == 'admin':
            pass
        elif request.user.role == 'workplace_supervisor':
            placements = placements.filter(
                workplace_supervisor=request.user
            )
        elif request.user.role == 'academic_supervisor':
            placements = placements.filter(
                academic_supervisor=request.user
            )
        else:
            placements = placements.filter(
                student=request.user
            )
        serializer = InternshipPlacementSerializer(placements, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can create placements'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = InternshipPlacementSerializer(data=request.data)
        if serializer.is_valid():
            try:
                placement = serializer.save()
            except ValidationError as e:
                # Convert model validation errors into HTTP 400 responses
                if hasattr(e, 'message_dict'):
                    err = e.message_dict.copy()
                    # tests expect the field key to be 'student_id' for placement creation
                    if 'student' in err:
                        err['student_id'] = err.pop('student')
                else:
                    err = {'error': e.messages}
                return Response(err, status=status.HTTP_400_BAD_REQUEST)
            notify_placement_created(placement, actor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AvailablePlacementListView(APIView):
    """
    API endpoint for browsing available internship placements.
    
    GET /api/available-placements/ - Retrieve unassigned placements (students only)
    
    Returns placements with no assigned student (student=null) and pending status.
    """

    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can browse available placements'},
                status=status.HTTP_403_FORBIDDEN,
            )
        placements = InternshipPlacement.objects.filter(student__isnull=True, status='pending')
        serializer = InternshipPlacementSerializer(placements, many=True)
        return Response(serializer.data)

class PlacementApplicationListCreateView(APIView):
    """
    API endpoint for managing placement applications.
    
    GET /api/placement-applications/ - List applications (admin: all, students: their own)
    POST /api/placement-applications/ - Submit new application (students only)
    """

    def get(self, request):
        if request.user.role == 'admin':
            apps = PlacementApplication.objects.all().order_by('-created_at')
        elif request.user.role == 'student':
            apps = PlacementApplication.objects.filter(student=request.user).order_by('-created_at')
        else:
            return Response(
                {'error': 'Access denied', 'detail': 'You do not have permission to access placement applications'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = PlacementApplicationSerializer(apps, many=True)
        return Response(serializer.data)

    def post(self, request):

        if request.user.role != 'student':
            return Response({'error': 'Only students can apply'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['student'] = request.user.id

        serializer = PlacementApplicationSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        placement = serializer.validated_data.get('placement')
        if not placement:
            return Response({'error': 'Placement is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if placement.student_id is not None:
            return Response({'error': 'Placement is no longer available'}, status=status.HTTP_400_BAD_REQUEST)

        app = serializer.save()
        return Response(PlacementApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class PlacementApplicationDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Only admins can decide applications'}, status=status.HTTP_403_FORBIDDEN)

        try:
            app = PlacementApplication.objects.get(pk=pk)
        except PlacementApplication.DoesNotExist:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        next_status = request.data.get('status')
        if next_status not in ['approved', 'rejected']:
            return Response({'error': 'status must be approved or rejected'}, status=status.HTTP_400_BAD_REQUEST)

        if next_status == 'approved':
            placement = app.placement
            if placement.student_id is not None and placement.student_id != app.student_id:
                return Response({'error': 'Placement already assigned'}, status=status.HTTP_400_BAD_REQUEST)
            placement.student = app.student
            placement.status = 'active'
            placement.save()
            PlacementApplication.objects.filter(
                placement=placement,
            ).exclude(pk=app.pk).update(status='rejected', decided_at=timezone.now())

        app.status = next_status
        app.decided_at = timezone.now()
        app.save()

        return Response(PlacementApplicationSerializer(app).data, status=status.HTTP_200_OK)
    
class InternshipPlacementDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            if request.user.role == 'admin':
                placement = InternshipPlacement.objects.get(pk=pk)
            elif request.user.role == 'workplace_supervisor':
                placement = InternshipPlacement.objects.get(pk=pk, workplace_supervisor=request.user)
            elif request.user.role == 'academic_supervisor':
                placement = InternshipPlacement.objects.get(pk=pk, academic_supervisor=request.user)
            else:
                placement = InternshipPlacement.objects.get(pk=pk, student=request.user)
        except InternshipPlacement.DoesNotExist:
            return Response({'error': 'Placement not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InternshipPlacementSerializer(placement)
        return Response(serializer.data)

    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Only admins can update placements'}, status=status.HTTP_403_FORBIDDEN)
        try:
            placement = InternshipPlacement.objects.get(pk=pk)
        except InternshipPlacement.DoesNotExist:
            return Response({'error': 'Placement not found'}, status=status.HTTP_404_NOT_FOUND)
        previous_status = placement.status
        requested_status = request.data.get('status', placement.status)
        status_was_explicitly_set = 'status' in request.data

        if status_was_explicitly_set:
            placement.status = requested_status
        serializer = InternshipPlacementSerializer(placement, data=request.data)
        if serializer.is_valid():
            updated_placement = serializer.save()
            # Notify whenever admin explicitly sends a status update payload.
            # This preserves workflow notifications even when model date-sync
            # resolves to the same final status.
            if status_was_explicitly_set:
                notify_placement_status_updated(updated_placement, previous_status, actor=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Only admins can delete placements'}, status=status.HTTP_403_FORBIDDEN)
        try:
            placement = InternshipPlacement.objects.get(pk=pk)
        except InternshipPlacement.DoesNotExist:
            return Response({'error': 'Placement not found'}, status=status.HTTP_404_NOT_FOUND)
        placement.delete()
        return Response({'message': 'Placement deleted'}, status=status.HTTP_204_NO_CONTENT)
    
class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        email = request.data.get('email', '').strip()
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = request.data.get('phone')

        logger.info(f'Registration attempt: username={username}, email={email}, phone={phone}')

        errors = {}

        if not username:
            errors['username'] = ['This field is required.']
        if not password:
            errors['password'] = ['This field is required.']
        if confirm_password is not None and password != confirm_password:
            errors['confirm_password'] = ['Passwords do not match.']
        if CustomUser.objects.filter(username=username).exists():
            errors['username'] = ['Username already exists.']
        if not email:
            errors['email'] = ['This field is required.']
        elif CustomUser.objects.filter(email__iexact=email).exists():
            errors['email'] = ['Email already exists.']

        try:
            first_name = validate_name_field(first_name, 'first_name')
        except ValidationError as exc:
            errors['first_name'] = exc.messages

        try:
            last_name = validate_name_field(last_name, 'last_name')
        except ValidationError as exc:
            errors['last_name'] = exc.messages

        try:
            phone = normalize_phone_number(phone)
        except ValidationError as exc:
            errors['phone'] = exc.messages

        if email and 'email' not in errors:
            try:
                logger.info(f'Verifying email format: {email}')
                EMAIL_VALIDATOR(email)
                logger.info(f'Email format valid, checking existence: {email}')
                if not verify_email_exists(email):
                    logger.warning(f'Email verification failed: {email}')
                    errors['email'] = ['Email could not be verified. Please use a valid existing email address.']
                else:
                    logger.info(f'Email verified successfully: {email}')
            except ValidationError as exc:
                logger.warning(f'Email validation error for {email}: {exc.messages}')
                errors['email'] = exc.messages

        allowed_roles = {'student', 'workplace_supervisor', 'academic_supervisor'}
        role = request.data.get('role', 'student')
        if role not in allowed_roles:
            errors['role'] = [f"Role must be one of: {', '.join(sorted(allowed_roles))}."]

        if errors:
            logger.warning(f'Registration validation errors for {username}: {errors}')
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            department=request.data.get('department'),
            staff_number=request.data.get('staff_number'),
            student_number=request.data.get('student_number'),
            registration_number=request.data.get('registration_number'),
        )
        
        logger.info(f'User created successfully: username={user.username}, email={user.email}, role={user.role}')
        
        # Create welcome notification for the new user
        Notification.objects.create(
            recipient=user,
            actor=None,  # System-generated notification
            notification_type='welcome',
            title='Welcome to ILES!',
            message='Welcome to the Internship Logging & Evaluation System! Click the help button (?) on your dashboard to access the user guide and learn how to use the system.',
            data={'user_guide': True}
        )
        
        return Response({
            'message': 'User created successfully',
            'username': user.username,
            'role': user.role,
        }, status=status.HTTP_201_CREATED)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        frontend_base = getattr(settings, 'FRONTEND_URL', 'https://iles-project-three.vercel.app')

        if not email:
            return Response({'email': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email__iexact=email).first()

        # Always return success to avoid leaking user existence
        if not user:
            return Response({'message': 'If an account with that email exists, a reset link has been sent.'})

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_path = f"/reset-password?uid={uid}&token={token}"
        reset_url = f"{frontend_base.rstrip('/')}{reset_path}"

        subject = 'ILES Password Reset'
        message = (
            f"Hello {user.get_full_name() or user.username},\n\n"
            f"You (or someone else) requested a password reset for your ILES account.\n"
            f"Click the link below to reset your password:\n\n{reset_url}\n\n"
            "If you did not request this, you can ignore this email.\n"
            "This link will expire in 24 hours.\n\n"
            "Thanks,\nILES System Team"
        )

        try:
            sent = send_email_via_gmail_api(
                recipient_email=user.email,
                subject=subject,
                message=message,
            )

            if sent:
                logger.info('✓ Password reset email sent via Gmail OAuth2 API to %s', user.email)
            else:
                logger.error('✗ Password reset email failed for %s. Ensure Gmail OAuth2 is configured correctly.', user.email)
                logger.debug('Password reset link: %s', reset_url)
        except Exception as e:
            # Log the error but still return success to the client for security
            logger.error('Unexpected error sending password reset email to %s: %s', user.email, str(e))
            logger.debug('Password reset link: %s', reset_url)

        return Response({'message': 'If an account with that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not uid or not token:
            return Response({'detail': 'uid and token are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password:
            return Response({'new_password': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({'confirm_password': ['Passwords do not match.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = CustomUser.objects.get(pk=uid_decoded)
        except Exception:
            return Response({'detail': 'Invalid uid.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)


class EvaluationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        evaluations = Evaluation.objects.select_related(
            'placement',
            'placement__student',
            'placement__workplace_supervisor',
            'placement__academic_supervisor',
            'evaluator',
        ).prefetch_related('evaluation_items')

        if request.user.role == 'admin':
            pass
        elif request.user.role == 'workplace_supervisor':
            evaluations = evaluations.filter(placement__workplace_supervisor=request.user)
        elif request.user.role == 'academic_supervisor':
            evaluations = evaluations.filter(placement__academic_supervisor=request.user)
        else:
            evaluations = evaluations.filter(placement__student=request.user)

        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ['admin', 'workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'You are not allowed to submit evaluations'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Auto-set evaluation_type based on user role
        data = request.data.copy()
        if request.user.role == 'academic_supervisor':
            data['evaluation_type'] = 'academic'
        elif request.user.role == 'workplace_supervisor':
            data['evaluation_type'] = 'supervisor'

        if request.user.role != 'admin':
            data['evaluator_id'] = request.user.id

        # Enforce that evaluations are attached to an existing weekly log for that placement/week.
        placement_id = data.get('placement') or data.get('placement_id')
        week_number = data.get('week_number')
        if placement_id and week_number:
            try:
                placement = InternshipPlacement.objects.get(pk=placement_id)
            except InternshipPlacement.DoesNotExist:
                return Response({'error': 'Placement not found'}, status=status.HTTP_404_NOT_FOUND)

            if request.user.role == 'workplace_supervisor' and placement.workplace_supervisor_id != request.user.id:
                return Response({'error': 'You can only evaluate your own placements'}, status=status.HTTP_403_FORBIDDEN)
            if request.user.role == 'academic_supervisor' and placement.academic_supervisor_id != request.user.id:
                return Response({'error': 'You can only evaluate your own placements'}, status=status.HTTP_403_FORBIDDEN)

            weekly_log = WeeklyLog.objects.filter(placement_id=placement_id, week_number=week_number).first()
            if weekly_log is None:
                return Response(
                    {'error': 'No weekly log exists for this placement and week.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if weekly_log.status != 'approved':
                return Response(
                    {'error': 'The weekly log must be approved by a supervisor before it can be evaluated.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if request.user.role == 'workplace_supervisor' and data.get('score') is not None:
            try:
                score_value = float(data.get('score'))
            except (TypeError, ValueError):
                return Response({'error': 'score must be a number'}, status=status.HTTP_400_BAD_REQUEST)
            if score_value < 0 or score_value > 100:
                return Response({'error': 'score must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = EvaluationSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            evaluation = serializer.save()
            
            # Update the weekly log status to 'reviewed' if it's not already 'approved'
            if placement_id and week_number:
                try:
                    weekly_log = WeeklyLog.objects.get(placement_id=placement_id, week_number=week_number)
                    if weekly_log.status != 'approved':
                        weekly_log.status = 'reviewed'
                        weekly_log.reviewed_at = timezone.now()
                        weekly_log.reviewed_by = request.user
                        weekly_log.save()
                except WeeklyLog.DoesNotExist:
                    pass
            
            notify_evaluation_status_changed(
                evaluation,
                actor=request.user,
                created=True,
                week_number=week_number,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile_data = request.data.get("profile", {})
        if not isinstance(profile_data, dict):
            profile_data = {}

        flat_profile_fields = {"bio", "avatar_url", "avatar_image", "location", "date_of_birth"}
        for key in flat_profile_fields:
            if key in request.data and request.data.get(key) not in (None, ""):
                profile_data[key] = request.data.get(key)
            prefixed_key = f"profile.{key}"
            if prefixed_key in request.data and request.data.get(prefixed_key) not in (None, ""):
                profile_data[key] = request.data.get(prefixed_key)

        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile_serializer = UserProfileSerializer(
            profile,
            data=profile_data,
            partial=True,
            )
        if not profile_serializer.is_valid():
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if 'password' in serializer.validated_data:
            serializer.validated_data.pop('password')

        serializer.save()
        profile_serializer.save()
        return Response(CustomUserSerializer(request.user).data)


class UserSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin' and request.user.pk != pk:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user = CustomUser.objects.get(pk=pk)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can view users"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if pk is not None:
            try:
                user = CustomUser.objects.get(pk=pk)
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = CustomUserSerializer(user)
            return Response(serializer.data)

        users = CustomUser.objects.all().order_by("role", "first_name", "username")
        role_filter = request.query_params.get("role")

        if role_filter:
            users = users.filter(role=role_filter)

        serializer = CustomUserSerializer(users, many=True)
        return Response(serializer.data)

    def put(self, request, pk):
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can update users"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can delete users"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user)
        unread_only = request.query_params.get("unread")
        limit = request.query_params.get("limit")

        if unread_only == "true":
            notifications = notifications.filter(is_read=False)

        if limit:
            try:
                notifications = notifications[: int(limit)]
            except ValueError:
                pass

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        serializer = NotificationSerializer(notification)
        return Response(serializer.data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"message": "Notifications marked as read"}, status=status.HTTP_200_OK)

class SupervisorReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role not in ['workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'Only supervisors can review logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            if request.user.role == 'workplace_supervisor':
                log = WeeklyLog.objects.get(pk=pk, placement__workplace_supervisor=request.user)
            else:
                log = WeeklyLog.objects.get(pk=pk, placement__academic_supervisor=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)

        if log.status != 'submitted':
            return Response(
                {'error': 'Only submitted logs can be reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = request.data.get('comment', '')
        log.status = 'reviewed'
        log.supervisor_comment = comment
        log.save()

        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)
    
class LogRevisionView(APIView):
    """
    PUT /api/logs/<pk>/revise/  - Supervisor sends log back to draft for revision
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role not in ['workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'Only supervisors can request revisions'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            if request.user.role == 'workplace_supervisor':
                log = WeeklyLog.objects.get(pk=pk, placement__workplace_supervisor=request.user)
            else:
                log = WeeklyLog.objects.get(pk=pk, placement__academic_supervisor=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)

        if log.status not in ['submitted', 'reviewed']:
            return Response(
                {'error': 'Can only revise submitted or reviewed logs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        log.status = 'draft'
        log.supervisor_comment = request.data.get('comment', 'Please revise and resubmit')
        log.save()

        # Trigger notification for log revision
        from .notification_service import NotificationService
        NotificationService.create_and_send_notification(
            recipient=log.placement.student,
            title="Log Revision Requested",
            message=f"Your Week {log.week_number} log needs revision: {log.supervisor_comment}",
            notification_type="log_revision_requested",
            actor=request.user,
            data={"log_id": log.id},
            send_email=True,
            send_sms=False
        )

        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)   

class SupervisorApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role not in ['workplace_supervisor', 'academic_supervisor', 'admin']:
            return Response(
                {'error': 'Only supervisors can approve logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            if request.user.role == 'admin':
                log = WeeklyLog.objects.get(pk=pk)
            elif request.user.role == 'workplace_supervisor':
                log = WeeklyLog.objects.get(pk=pk, placement__workplace_supervisor=request.user)
            else:
                log = WeeklyLog.objects.get(pk=pk, placement__academic_supervisor=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)

        if log.status != 'reviewed':
            return Response(
                {'error': 'Only reviewed logs can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        log.status = 'approved'
        log.save()

        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': 'old_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(new_password)
        request.user.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
class EvaluationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            if request.user.role == 'admin':
                evaluation = Evaluation.objects.get(pk=pk)
            elif request.user.role == 'workplace_supervisor':
                evaluation = Evaluation.objects.get(pk=pk, placement__workplace_supervisor=request.user)
            elif request.user.role == 'academic_supervisor':
                evaluation = Evaluation.objects.get(pk=pk, placement__academic_supervisor=request.user)
            else:
                evaluation = Evaluation.objects.get(pk=pk, placement__student=request.user)
        except Evaluation.DoesNotExist:
            return Response({'error': 'Evaluation not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EvaluationSerializer(evaluation)
        return Response(serializer.data)

    def put(self, request, pk):
        if request.user.role not in ['admin', 'workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'You are not allowed to update evaluations'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            if request.user.role == 'admin':
                evaluation = Evaluation.objects.get(pk=pk)
            elif request.user.role == 'workplace_supervisor':
                evaluation = Evaluation.objects.get(pk=pk, placement__workplace_supervisor=request.user)
            else:
                evaluation = Evaluation.objects.get(pk=pk, placement__academic_supervisor=request.user)
        except Evaluation.DoesNotExist:
            return Response({'error': 'Evaluation not found'}, status=status.HTTP_404_NOT_FOUND)
        # Auto-set evaluation_type based on user role for updates too
        data = request.data.copy()
        if request.user.role == 'academic_supervisor':
            data['evaluation_type'] = 'academic'
        elif request.user.role == 'workplace_supervisor':
            data['evaluation_type'] = 'supervisor'

        if request.user.role != 'admin':
            data['evaluator_id'] = request.user.id

        requested_placement_id = data.get('placement') or data.get('placement_id') or getattr(evaluation.placement, 'id', None)
        if request.user.role == 'workplace_supervisor' and requested_placement_id:
            if not InternshipPlacement.objects.filter(pk=requested_placement_id, workplace_supervisor=request.user).exists():
                return Response({'error': 'You can only update evaluations for your own placements'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'academic_supervisor' and requested_placement_id:
            if not InternshipPlacement.objects.filter(pk=requested_placement_id, academic_supervisor=request.user).exists():
                return Response({'error': 'You can only update evaluations for your own placements'}, status=status.HTTP_403_FORBIDDEN)

        if data.get('score') is not None:
            try:
                score_value = float(data.get('score'))
            except (TypeError, ValueError):
                return Response({'error': 'score must be a number'}, status=status.HTTP_400_BAD_REQUEST)
            if score_value < 0 or score_value > 100:
                return Response({'error': 'score must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)

        placement_id = data.get('placement') or data.get('placement_id') or getattr(evaluation.placement, 'id', None)
        week_number = data.get('week_number') or getattr(evaluation, 'week_number', None)
        if placement_id and week_number:
            if not WeeklyLog.objects.filter(placement_id=placement_id, week_number=week_number).exists():
                return Response(
                    {'error': 'No weekly log exists for this placement and week.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = EvaluationSerializer(evaluation, data=data, context={'request': request})
        if serializer.is_valid():
            updated_evaluation = serializer.save()
            notify_evaluation_status_changed(
                updated_evaluation,
                actor=request.user,
                created=False,
                week_number=week_number,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can delete evaluations'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            evaluation = Evaluation.objects.get(pk=pk)
        except Evaluation.DoesNotExist:
            return Response({'error': 'Evaluation not found'}, status=status.HTTP_404_NOT_FOUND)
        evaluation.delete()
        return Response({'message': 'Evaluation deleted'}, status=status.HTTP_204_NO_CONTENT)

class EvaluationCriteriaListView(APIView):
    """
    GET  /api/criteria/  - List all evaluation criteria
    POST /api/criteria/  - Create criteria (admin only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        criteria = EvaluationCriteria.objects.all()
        serializer = EvaluationCriteriaSerializer(criteria, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can create evaluation criteria'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = EvaluationCriteriaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EvaluationCriteriaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can update evaluation criteria'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            criteria = EvaluationCriteria.objects.get(pk=pk)
        except EvaluationCriteria.DoesNotExist:
            return Response({'error': 'Criteria not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EvaluationCriteriaSerializer(criteria, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can delete evaluation criteria'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            criteria = EvaluationCriteria.objects.get(pk=pk)
        except EvaluationCriteria.DoesNotExist:
            return Response({'error': 'Criteria not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            criteria.delete()
        except Exception:
            return Response(
                {'error': 'This criteria is already used in an evaluation and cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({'message': 'Criteria deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

class WeeklyLogSubmitView(APIView):
    """
    PUT /api/logs/<pk>/submit/ - Student submits a draft log
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            log = WeeklyLog.objects.get(pk=pk, placement__student=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)

        if log.status != 'draft':
            return Response(
                {'error': 'Only draft logs can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if log.placement.get_computed_status() == 'completed':
            return Response(
                {'error': 'Cannot submit a weekly log for a completed placement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if log.placement.get_computed_status() == 'pending':
            return Response(
                {'error': 'Cannot submit a weekly log for a pending placement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if log.calculate_deadline() and timezone.now().date() > log.calculate_deadline():
            return Response(
                {'error': 'Cannot submit after deadline'},
                status=status.HTTP_400_BAD_REQUEST
            )

        log.status = 'submitted'
        log.submitted_at = timezone.now()
        log.save()
        notify_log_submitted(log, actor=request.user)

        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)    

class AdminStatisticsView(APIView):
    """
    GET /api/admin/statistics/ - System-wide stats for admin dashboard
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin only'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Count unique (placement, week_number) combinations that have evaluations
        # Each combination represents one log that has been evaluated
        logs_with_evaluations = Evaluation.objects.values('placement_id', 'week_number').distinct().count()
        
        stats = {
            'total_students': CustomUser.objects.filter(role='student').count(),
            'total_supervisors': CustomUser.objects.filter(role='workplace_supervisor').count(),
            'total_placements': InternshipPlacement.objects.count(),
            'active_placements': InternshipPlacement.objects.filter(status='active').count(),
            'total_logs': WeeklyLog.objects.count(),
            'pending_logs': WeeklyLog.objects.filter(status='submitted').count(),
            'approved_logs': WeeklyLog.objects.filter(status='approved').count(),
            'reviewed_logs': WeeklyLog.objects.filter(status='reviewed').count(),
            'draft_logs': WeeklyLog.objects.filter(status='draft').count(),
            'total_evaluations': logs_with_evaluations,
            'logs_by_status': list(
                WeeklyLog.objects.values('status').annotate(count=Count('id'))
            ),
        }
        return Response(stats)


class ChatContactsView(APIView):
    """
    GET /api/chat/contacts/ - Get list of users the current user can chat with (role-restricted)
    Returns sorted by most recent message, includes unread count
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        contact_ids = set()

        if user.role == 'student':
            # Students can chat with their supervisors and admin
            placements = InternshipPlacement.objects.filter(student=user).select_related(
                'workplace_supervisor', 'academic_supervisor'
            )
            supervisor_ids = set()
            for placement in placements:
                # Add workplace supervisor if exists
                if placement.workplace_supervisor:
                    supervisor_ids.add(placement.workplace_supervisor.id)
                # Add academic supervisor if exists
                if placement.academic_supervisor:
                    supervisor_ids.add(placement.academic_supervisor.id)
            contact_ids = supervisor_ids
            # Add admins
            admin_ids = set(CustomUser.objects.filter(role='admin').values_list('id', flat=True))
            contact_ids.update(admin_ids)

        elif user.role in ['workplace_supervisor', 'academic_supervisor']:
            # Supervisors can chat with their students and admin
            if user.role == 'workplace_supervisor':
                placements = InternshipPlacement.objects.filter(
                    workplace_supervisor=user
                ).select_related('student')
            else:
                placements = InternshipPlacement.objects.filter(
                    academic_supervisor=user
                ).select_related('student')
            
            student_ids = set()
            for placement in placements:
                if placement.student:
                    student_ids.add(placement.student.id)
            contact_ids = student_ids
            # Add admins
            admin_ids = set(CustomUser.objects.filter(role='admin').values_list('id', flat=True))
            contact_ids.update(admin_ids)

        elif user.role == 'admin':
            # Admin can chat with all other users
            contact_ids = set(CustomUser.objects.exclude(id=user.id).values_list('id', flat=True))

        # Get contacts with message metadata
        contacts_data = []
        for contact_id in contact_ids:
            try:
                contact_user = CustomUser.objects.get(id=contact_id)
                
                # Get most recent message timestamp
                most_recent = ChatMessage.objects.filter(
                    (models.Q(sender=user, recipient=contact_user) | models.Q(sender=contact_user, recipient=user))
                ).order_by('-created_at').first()
                
                # Get unread count from this contact
                unread_count = ChatMessage.objects.filter(
                    sender=contact_user,
                    recipient=user,
                    is_read=False
                ).count()
                
                # Use serializer to include profile data (avatar fields)
                serialized = CustomUserSerializer(contact_user, context={'request': request}).data
                # Add messaging metadata
                serialized['unread_count'] = unread_count
                serialized['last_message_time'] = most_recent.created_at if most_recent else None
                contacts_data.append(serialized)
            except CustomUser.DoesNotExist:
                # Skip if user doesn't exist
                continue
        
        # Sort by most recent message (contacts without messages stay at the end)
        contacts_data.sort(
            key=lambda x: (x['last_message_time'] is not None, x['last_message_time'] or timezone.now()),
            reverse=True,
        )
        
        return Response(contacts_data)


class ChatMessagesView(APIView):
    """
    GET /api/chat/messages/<recipient_id>/ - Get messages between current user and recipient
    POST /api/chat/messages/<recipient_id>/ - Send a message
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, recipient_id):
        try:
            recipient = CustomUser.objects.get(pk=recipient_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if users can communicate
        if not self._can_communicate(request.user, recipient):
            return Response({'error': 'You are not allowed to communicate with this user'}, status=status.HTTP_403_FORBIDDEN)

        messages = ChatMessage.objects.filter(
            (models.Q(sender=request.user, recipient=recipient) | models.Q(sender=recipient, recipient=request.user))
        ).order_by('created_at')

        # Mark received messages as read
        ChatMessage.objects.filter(sender=recipient, recipient=request.user, is_read=False).update(is_read=True)

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, recipient_id):
        try:
            recipient = CustomUser.objects.get(pk=recipient_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if users can communicate
        if not self._can_communicate(request.user, recipient):
            return Response({'error': 'You are not allowed to communicate with this user'}, status=status.HTTP_403_FORBIDDEN)

        message_text = request.data.get('message')
        if not message_text or not message_text.strip():
            return Response({'message': ['Message cannot be empty']}, status=status.HTTP_400_BAD_REQUEST)

        chat_message = ChatMessage.objects.create(
            sender=request.user,
            recipient=recipient,
            message=message_text.strip()
        )

        serializer = ChatMessageSerializer(chat_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _can_communicate(self, sender, recipient):
        """Check if sender can communicate with recipient based on roles."""
        if sender.id == recipient.id:
            return False

        if sender.role == 'admin' or recipient.role == 'admin':
            return True

        if sender.role == 'student':
            # Student can only chat with supervisors
            placements = InternshipPlacement.objects.filter(student=sender)
            supervisor_ids = set()
            for placement in placements:
                if placement.workplace_supervisor_id:
                    supervisor_ids.add(placement.workplace_supervisor_id)
                if placement.academic_supervisor_id:
                    supervisor_ids.add(placement.academic_supervisor_id)
            return recipient.id in supervisor_ids

        elif sender.role in ['workplace_supervisor', 'academic_supervisor']:
            # Supervisor can only chat with their students
            if sender.role == 'workplace_supervisor':
                placements = InternshipPlacement.objects.filter(workplace_supervisor=sender)
            else:
                placements = InternshipPlacement.objects.filter(academic_supervisor=sender)
            
            student_ids = set()
            for placement in placements:
                if placement.student_id:
                    student_ids.add(placement.student_id)
            return recipient.id in student_ids

        return False
# split commit: refactor(views): enhance weekly log status validation
