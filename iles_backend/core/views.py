# ILES Backend API Views
# Built by Mugabe Gideon
# Endpoints: WeeklyLog, Placement, Evaluation, Auth, Profile, Supervisor Workflow
from urllib import request

from .models import CustomUser, InternshipPlacement, Notification, WeeklyLog, Evaluation, EvaluationCriteria
from .serializers import (
    CustomUserSerializer,
    InternshipPlacementSerializer,
    WeeklyLogSerializer,
    EvaluationSerializer,
    EvaluationCriteriaSerializer,
    NotificationSerializer,
    UserSummarySerializer,
    UserProfileSerializer,
)
from .services import (
    notify_log_submitted,
    notify_placement_created,
    notify_placement_status_updated,
)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Avg

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
            log = serializer.save()
            # Set submitted_at timestamp if status is submitted
            if log.status == 'submitted':
                from django.utils import timezone
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
            placement = serializer.validated_data['placement']
            if placement.student != request.user:
                return Response(
                    {'error': 'You can only update logs for your own placement'},
                    status=status.HTTP_403_FORBIDDEN
                )

            status_value = serializer.validated_data.get('status', log.status)
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
        serializer = InternshipPlacementSerializer(placement, data=request.data)
        if serializer.is_valid():
            updated_placement = serializer.save()
            if previous_status != updated_placement.status:
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
        serializer = CustomUserSerializer(data=request.data)            
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        username = request.data.get('username')
        if not username:
            return Response({'username': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        
        user = CustomUser.objects.create_user(
            username = serializer.validated_data['username'],
            email = serializer.validated_data.get('email',''),
            password = serializer.validated_data['password'],
            role = serializer.validated_data.get('role', 'student'),
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            phone=serializer.validated_data.get('phone', ''),
            department=serializer.validated_data.get('department', ''),
            staff_number=serializer.validated_data.get('staff_number', ''),
            student_number=serializer.validated_data.get('student_number', ''),
        )
        return Response({
            'message': 'User created successfully',
            'username': user.username,
            'role': user.role,
        }, status=status.HTTP_201_CREATED)
    
    
class EvaluationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role in ['admin', 'workplace_supervisor', 'academic_supervisor']:
            evaluations = Evaluation.objects.all()
        else:
            evaluations = Evaluation.objects.filter(
                placement__student=request.user
            )
            # Calculate total score if all 3 evaluations exist
            if evaluations.count() == 3:
                scores = {e.evaluation_type: e.score for e in evaluations}
                total = (
                    (scores.get('supervisor', 0) * 40 / 100) +
                    (scores.get('academic', 0) * 30 / 100) +
                    (scores.get('logbook', 0) * 30 / 100)
                )
                return Response({
                    'evaluations': EvaluationSerializer(evaluations, many=True).data,
                    'total_score': round(total, 2),
                    'complete': True
                })
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ['admin', 'workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'You are not allowed to submit evaluations'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = EvaluationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
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

        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile_serializer = UserProfileSerializer(
            request.user.profile,
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

        serializer = UserSummarySerializer(users, many=True)
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

        from django.utils import timezone
        import datetime
        if log.deadline and datetime.date.today() > log.deadline:
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

from django.db.models import Count, Avg

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
