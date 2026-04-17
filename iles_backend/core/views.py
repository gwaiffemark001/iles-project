# ILES Backend API Views
# Built by Mugabe Gideon
# Endpoints: WeeklyLog, Placement, Evaluation, Auth, Profile, Supervisor Workflow
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import CustomUser, Evaluation, InternshipPlacement, WeeklyLog
from .serializers import (
    CustomUserSerializer,
    EvaluationSerializer,
    InternshipPlacementSerializer,
    WeeklyLogSerializer,
)

class WeeklyLogListView(APIView):
    permission_classes =[IsAuthenticated]   

    def get(self, request):
        if request.user.role == 'admin':
            logs = WeeklyLog.objects.all()
        elif request.user.role == 'workplace_supervisor':
            logs = WeeklyLog.objects.filter(placement__workplace_supervisor=request.user)
        elif request.user.role == 'academic_supervisor':
            logs = WeeklyLog.objects.filter(placement__academic_supervisor=request.user)
        else:
            logs = WeeklyLog.objects.filter(placement__student=request.user)
        serializer = WeeklyLogSerializer(logs, many=True)
        return Response(serializer.data) 
    
    def post(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can create weekly logs'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = WeeklyLogSerializer(data=request.data)
        if serializer.is_valid():
            placement = serializer.validated_data['placement']
            if placement.student != request.user:
                return Response(
                    {'error': 'You can only create logs for your own placement'},
                    status=status.HTTP_403_FORBIDDEN
                )

            status_value = serializer.validated_data.get('status', 'draft')
            serializer.save(
                submitted_at=timezone.now() if status_value == 'submitted' else None
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class WeeklyLogDetailView(APIView):
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
            serializer.save(
                submitted_at=timezone.now() if status_value == 'submitted' else None
            )
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
            serializer.save()
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
        serializer = InternshipPlacementSerializer(placement, data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        # Admins and supervisors see all evaluations
        # Students only see their own evaluations
        if request.user.role in ['admin', 'workplace_supervisor', 'academic_supervisor']:
            evaluations = Evaluation.objects.all()
        else:
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
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'password' in serializer.validated_data:
                serializer.validated_data.pop('password')
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        

