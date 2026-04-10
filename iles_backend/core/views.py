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

class WeeklyLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get (self, request, pk):
        try:
            log = WeeklyLog.objects.get(pk=pk)
        except WeeklyLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WeeklyLogSerializer(log)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            log=WeeklyLog.objects.get(pk=pk)
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
        placements = InternshipPlacement.objects.filter(student=request.user)
        serializer = InternshipPlacementSerializer(placements, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = InternshipPlacementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  


class UserRegistrationView(APIView):
    permission_class = [AllowAny] # Anyone can register - no token needed

    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)            
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get('username')
        if not username:
            return Response({'username': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(
            username=username,
            email=request.data.get('email'),
            password=request.data.get('password'),
            role=request.data.get('role', 'student'),
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
        serializer = EvaluationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

