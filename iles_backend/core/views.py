from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser, InternshipPlacement, WeeklyLog
from .serializers import CustomUserSerializer, InternshipPlacementSerializer, WeeklyLogSerializer
class WeeklyLogListView(APIView):
    permission_classes =[IsAuthenticated]   

    def get(self, request):
        logs = WeeklyLog.objects.filter(placement__student==request.user)
        serializer = WeeklyLogSerializer(logs, many=True)
        return Response(serializer.data) 
    
    def post(self, request):
        serializer = WeeklyLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        return Response(serializer.errors, status=status.HTTP_400_NOT_FOUND)
