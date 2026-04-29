from rest_framework import serializers
from .models import CustomUser, InternshipPlacement, WeeklyLog, EvaluationCriteria, Evaluation, PlacementApplication, Notification
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
        full_name = serializers.SerializerMethodField()

def get_full_name(self, obj):
    return f"{obj.first_name} {obj.last_name}"

class InternshipPlacementSerializer(serializers.ModelSerializer):
    student = CustomUserSerializer(read_only=True)
    workplace_supervisor = CustomUserSerializer(read_only=True)
    academic_supervisor = CustomUserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        source="student",
        queryset=CustomUser.objects.filter(role="student"),
        write_only=True,
        required=False,
    )
    workplace_supervisor_id = serializers.PrimaryKeyRelatedField(
        source="workplace_supervisor",
        queryset=CustomUser.objects.filter(role="workplace_supervisor"),
        write_only=True,
        required=False,
    )
    academic_supervisor_id = serializers.PrimaryKeyRelatedField(
        source="academic_supervisor",
        queryset=CustomUser.objects.filter(role="academic_supervisor"),
        write_only=True,
        required=False,
    )
    student_name = serializers.SerializerMethodField(read_only=True)
    workplace_supervisor_name = serializers.SerializerMethodField(read_only=True)
    academic_supervisor_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InternshipPlacement
        fields = '__all__'

class PlacementApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField(read_only=True)
    workplace_supervisor_name = serializers.SerializerMethodField(read_only=True)
    academic_supervisor_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = PlacementApplication
        fields = [
            "id",
            "student",
            "student_id",
            "student_name",
            "workplace_supervisor",
            "workplace_supervisor_id",
            "workplace_supervisor_name",
            "academic_supervisor",
            "academic_supervisor_id",
            "academic_supervisor_name",
            "company_name",
            "company_address",
            "start_date",
            "end_date",
            "status",
            "created_at",
        ]

    def validate(self, attrs):
        placement = getattr(self, "instance", None)
        student = attrs.get("student") or getattr(placement, "student", None)
        workplace_supervisor = attrs.get("workplace_supervisor") or getattr(placement, "workplace_supervisor", None)
        academic_supervisor = attrs.get("academic_supervisor") or getattr(placement, "academic_supervisor", None)
        start_date = attrs.get("start_date") or getattr(placement, "start_date", None)
        end_date = attrs.get("end_date") or getattr(placement, "end_date", None)

        required_fields = {
            "student_id": student,
            "workplace_supervisor_id": workplace_supervisor,
            "academic_supervisor_id": academic_supervisor,
            "company_name": attrs.get("company_name") or getattr(placement, "company_name", None),
            "start_date": start_date,
            "end_date": end_date,
        }

        missing_fields = [field_name for field_name, value in required_fields.items() if not value]
        if missing_fields:
            raise serializers.ValidationError(
                {field_name: ["This field is required."] for field_name in missing_fields}
            )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": ["End date must be on or after the start date."]}
            )

        if student:
            active_placements = InternshipPlacement.objects.filter(
                student=student,
                status__in=["pending", "active"],
            )

            if placement:
                active_placements = active_placements.exclude(pk=placement.pk)

            if active_placements.exists():
                raise serializers.ValidationError(
                    {
                        "student_id": [
                            "This student already has a pending or active internship placement."
                        ]
                    }
                )

        return attrs

    def get_student_name(self, obj):
        return CustomUserSerializer(obj.student).data["full_name"]

    def get_workplace_supervisor_name(self, obj):
        return CustomUserSerializer(obj.workplace_supervisor).data["full_name"]

    def get_academic_supervisor_name(self, obj):
        return CustomUserSerializer(obj.academic_supervisor).data["full_name"]

class WeeklyLogSerializer(serializers.ModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)
    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
        required=False,
    )
    student_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WeeklyLog
        fields = [
            "id",
            "placement",
            "placement_id",
            "student_name",
            "week_number",
            "activities",
            "challenges",
            "learning",
            "status",
            "supervisor_comment",
            "deadline",
            "submitted_at",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        return CustomUserSerializer(obj.placement.student).data["full_name"]


class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = "__all__"


class EvaluationSerializer(serializers.ModelSerializer):
    placement = InternshipPlacementSerializer(read_only=True)
    placement_id = serializers.PrimaryKeyRelatedField(
        source="placement",
        queryset=InternshipPlacement.objects.all(),
        write_only=True,
        required=False,
    )
    evaluator = CustomUserSerializer(read_only=True) 
    evaluator_id = serializers.PrimaryKeyRelatedField(
        source="evaluator",
        queryset=CustomUser.objects.all(),
        write_only=True,
        required=False,
    )
    evaluator_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Evaluation
        fields = ["id", "placement", "placement_id", "evaluator", "evaluator_id", "evaluator_name", "score", "evaluation_type", "evaluated_at",
        ]

    def get_evaluator_name(self, obj):
        return CustomUserSerializer(obj.evaluator).data["full_name"]


class NotificationSerializer(serializers.ModelSerializer):
    recipient = CustomUserSerializer(read_only=True)
    actor = CustomUserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "actor",
            "notification_type",
            "title",
            "message",
            "data",
            "is_read",
            "created_at",
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'