from rest_framework import serializers

from .models import CustomUser, Evaluation, EvaluationCriteria, InternshipPlacement, WeeklyLog


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone",
            "department",
            "staff_number",
            "student_number",
        ]

    def get_full_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username


class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone",
            "department",
            "staff_number",
            "student_number",
            "password",
        ]

    def get_full_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username


class InternshipPlacementSerializer(serializers.ModelSerializer):
    student = UserSummarySerializer(read_only=True)
    workplace_supervisor = UserSummarySerializer(read_only=True)
    academic_supervisor = UserSummarySerializer(read_only=True)
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

    def get_student_name(self, obj):
        return UserSummarySerializer(obj.student).data["full_name"]

    def get_workplace_supervisor_name(self, obj):
        return UserSummarySerializer(obj.workplace_supervisor).data["full_name"]

    def get_academic_supervisor_name(self, obj):
        return UserSummarySerializer(obj.academic_supervisor).data["full_name"]


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
        return UserSummarySerializer(obj.placement.student).data["full_name"]


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
    evaluator = UserSummarySerializer(read_only=True)
    evaluator_id = serializers.PrimaryKeyRelatedField(
        source="evaluator",
        queryset=CustomUser.objects.all(),
        write_only=True,
        required=False,
    )
    evaluator_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "placement",
            "placement_id",
            "evaluator",
            "evaluator_id",
            "evaluator_name",
            "score",
            "evaluation_type",
            "evaluated_at",
        ]

    def get_evaluator_name(self, obj):
        return UserSummarySerializer(obj.evaluator).data["full_name"]
                        
