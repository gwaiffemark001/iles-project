from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser, InternshipPlacement, WeeklyLog, Evaluation 
from .serializers import CustomUserSerializer, InternshipPlacementSerializer, WeeklyLogSerializer , EvaluationSerializer
class WeeklyLogListView(APIView):
    permission_classes =[IsAuthenticated]   

    def get(self, request):
        logs = WeeklyLog.objects.filter(placement__student=request.user)
        serializer = WeeklyLogSerializer(logs, many=True)
        return Response(serializer.data) 
    
    def post(self, request):
        serializer = WeeklyLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk):
        try:
            log = WeeklyLog.objects.get(pk=pk, placement__student=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
        if log.status != 'draft':
            return Response({'error': 'Only draft logs can be deleted'}, status=status.HTTP_400_BAD_REQUEST)
        log.delete()
        return Response({'message': 'Log deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    
class WeeklyLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            log = WeeklyLog.objects.get(pk=pk, placement__student=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            log=WeeklyLog.objects.get(pk=pk, placement__student=request.user)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log Not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = WeeklyLogSerializer(log, data=request.data)
                                
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
          
        )
        return Response({
            'message': 'User created successfully',
            'username': user.username,
            'role': user.role,
        }, status=status.HTTP_201_CREATED)
    
    
class EvaluationListView(APIView):
    permission_classes = [IsAuthenticated]
    '''
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
    '''
    def get(self, request):
     if request.user.role == 'student':
        evaluations = Evaluation.objects.filter(placement__student=request.user)
        
        # check if all three evaluations are done
        if evaluations.count() == 3:
            supervisor = evaluations.get(evaluation_type='supervisor').score
            academic = evaluations.get(evaluation_type='academic').score
            logbook = evaluations.get(evaluation_type='logbook').score

            total = (
                (supervisor * 40 / 100) +
                (academic * 30 / 100) +
                (logbook * 30 / 100)
            )

            return Response({
                'evaluations': EvaluationSerializer(evaluations, many=True).data,
                'total_score': total,
                'complete': True
            })
        else:
            # not all evaluations done yet
            return Response({
                'evaluations': EvaluationSerializer(evaluations, many=True).data,
                'total_score': None,
                'complete': False,
                'message': f'{evaluations.count()} of 3 evaluations completed'
            })
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
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
