from rest_framework import serializers
from .models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation
class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True) 
    class Meta:
        model = CustomUser
        fields =[
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'phone',
            'department',
            'staff_number',
            'student_number',
            'registration_number',
            'password',
        ]
class InternshipPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipPlacement
        fields = '__all__'
class WeeklyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model =WeeklyLog
        fields ='__all__'              
class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = '__all__'
class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation 
        fields = '__all__'
                        