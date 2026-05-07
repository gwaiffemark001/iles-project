# ILES Backend API Views
# Built by Mugabe Gideon
# Endpoints: WeeklyLog, Placement, Evaluation, Auth, Profile, Supervisor Workflow
from django.db.models import Avg, Count
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
import os
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    CustomUser,
    Evaluation,
    EvaluationCriteria,
    InternshipPlacement,
    Notification,
    PlacementApplication,
    WeeklyLog,
)
from .serializers import (
    CustomUserSerializer,
    EvaluationCriteriaSerializer,
    EvaluationSerializer,
    InternshipPlacementSerializer,
    NotificationSerializer,
    PlacementApplicationSerializer,
    UserProfileSerializer,
    UserSummarySerializer,
    WeeklyLogSerializer,
)
from .services import (
    notify_log_submitted,
    notify_placement_created,
    notify_placement_status_updated,
)

class WeeklyLogListView(APIView):
    """
    GET /api/logs/ - list logs for logged in user (role-based)
    POST /api/logs/ - Create a new weekly log
    """
    permission_classes =[IsAuthenticated]   

    def get(self, request):
        if request.user.role == 'admin':
            logs = WeeklyLog.objects.all()
        elif request.user.role == 'workplace_supervisor':
            logs = WeeklyLog.objects.filter(
                placement__workplace_supervisor=request.user
            )
        elif request.user.role == 'academic_supervisor':
            logs = WeeklyLog.objects.filter(
                placement__academic_supervisor=request.user
            )
        else:
            logs = WeeklyLog.objects.filter(placement__student=request.user)

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

            if WeeklyLog.objects.filter(placement=placement, week_number=week_number).exists():
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
    GET /api/placements/ - List placements (filtered by role)
    POST /api/logs/<pk>/ - DELETE a draft log
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'admin':
            placements = InternshipPlacement.objects.all()
        elif request.user.role == 'workplace_supervisor':
            placements = InternshipPlacement.objects.filter(
                workplace_supervisor=request.user
            )
        elif request.user.role == 'academic_supervisor':
            placements = InternshipPlacement.objects.filter(
                academic_supervisor=request.user
            )
        else:
            placements = InternshipPlacement.objects.filter(
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
            placement = serializer.save()
            notify_placement_created(placement, actor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvailablePlacementListView(APIView):
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'admin':
            apps = PlacementApplication.objects.all().order_by('-created_at')
        elif request.user.role == 'student':
            apps = PlacementApplication.objects.filter(student=request.user).order_by('-created_at')
        else:
            return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
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
            placement = InternshipPlacement.objects.get(pk=pk)
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
        if requested_status != placement.status:
            placement.status = requested_status
        serializer = InternshipPlacementSerializer(placement, data=request.data)
        if serializer.is_valid():
            updated_placement = serializer.save()
            if previous_status != requested_status:
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
        email = request.data.get('email', '')

        if not username:
            return Response({'username': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({'password': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if confirm_password is not None and password != confirm_password:
            return Response({'confirm_password': ['Passwords do not match.']}, status=status.HTTP_400_BAD_REQUEST)
        if CustomUser.objects.filter(username=username).exists():
            return Response({'username': ['Username already exists.']}, status=status.HTTP_400_BAD_REQUEST)
        if email and CustomUser.objects.filter(email=email).exists():
            return Response({'email': ['Email already exists.']}, status=status.HTTP_400_BAD_REQUEST)

        allowed_roles = {'student', 'workplace_supervisor', 'academic_supervisor'}
        role = request.data.get('role', 'student')
        if role not in allowed_roles:
            return Response(
                {'role': [f"Role must be one of: {', '.join(sorted(allowed_roles))}."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            phone=request.data.get('phone'),
            department=request.data.get('department'),
            staff_number=request.data.get('staff_number'),
            student_number=request.data.get('student_number'),
            registration_number=request.data.get('registration_number'),
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
        frontend_base = os.getenv('FRONTEND_URL', 'http://localhost:5173')

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

        subject = 'ILES password reset'
        message = (
            f"Hello {user.get_full_name() or user.username},\n\n"
            f"You (or someone else) requested a password reset for your ILES account.\n"
            f"Click the link below to reset your password:\n\n{reset_url}\n\n"
            "If you did not request this, you can ignore this email.\n\n"
            "Thanks,\nILES Team"
        )

        try:
            from django.conf import settings
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER or settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Fallback: log to console if email backend not configured or sending fails
            print('Password reset link (development):', reset_url)
            print('Email error:', str(e))

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
        if request.user.role in ['admin', 'workplace_supervisor', 'academic_supervisor']:
            evaluations = Evaluation.objects.all()
            serializer = EvaluationSerializer(evaluations, many=True)
            return Response(serializer.data)
        else:
            # For students, return only their placement evaluations
            evaluations = Evaluation.objects.filter(
                placement__student=request.user
            )
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

        # Enforce that evaluations are attached to an existing weekly log for that placement/week.
        placement_id = data.get('placement') or data.get('placement_id')
        week_number = data.get('week_number')
        if placement_id and week_number:
            if not WeeklyLog.objects.filter(placement_id=placement_id, week_number=week_number).exists():
                return Response(
                    {'error': 'No weekly log exists for this placement and week.'},
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
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile_data = request.data.get("profile", {})
        if not isinstance(profile_data, dict):
            profile_data = {}

        flat_profile_fields = {"bio", "avatar_url", "location", "date_of_birth"}
        if not profile_data:
            profile_data = {
                key: request.data.get(key)
                for key in flat_profile_fields
                if key in request.data
            }

        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile_serializer = UserProfileSerializer(
            request.user,
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


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can view users"},
                status=status.HTTP_403_FORBIDDEN,
            )

        users = CustomUser.objects.all().order_by("role", "first_name", "username")
        role_filter = request.query_params.get("role")

        if role_filter:
            users = users.filter(role=role_filter)

        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)


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
            log = WeeklyLog.objects.get(pk=pk)
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
            log = WeeklyLog.objects.get(pk=pk)
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
            log = WeeklyLog.objects.get(pk=pk)
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
            evaluation = Evaluation.objects.get(pk=pk)
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
            evaluation = Evaluation.objects.get(pk=pk)
        except Evaluation.DoesNotExist:
            return Response({'error': 'Evaluation not found'}, status=status.HTTP_404_NOT_FOUND)
        # Auto-set evaluation_type based on user role for updates too
        data = request.data.copy()
        if request.user.role == 'academic_supervisor':
            data['evaluation_type'] = 'academic'
        elif request.user.role == 'workplace_supervisor':
            data['evaluation_type'] = 'supervisor'

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
            serializer.save()
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
        stats = {
            'total_students': CustomUser.objects.filter(role='student').count(),
            'total_supervisors': CustomUser.objects.filter(role='workplace_supervisor').count(),
            'total_placements': InternshipPlacement.objects.count(),
            'active_placements': InternshipPlacement.objects.filter(status='active').count(),
            'total_logs': WeeklyLog.objects.count(),
            'pending_logs': WeeklyLog.objects.filter(status='submitted').count(),
            'approved_logs': WeeklyLog.objects.filter(status='approved').count(),
            'draft_logs': WeeklyLog.objects.filter(status='draft').count(),
            'total_evaluations': Evaluation.objects.count(),
            'logs_by_status': list(
                WeeklyLog.objects.values('status').annotate(count=Count('id'))
            ),
        }
        return Response(stats)

class UserSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = CustomUser.objects.get(pk=pk)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = CustomUser.objects.all()
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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.delete()
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

