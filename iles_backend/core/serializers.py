from django.utils import timezone
from rest_framework import serializers
from .models import (
    CustomUser,
    Evaluation,
    EvaluationItem,
    EvaluationCriteria,
    InternshipPlacement,
    Notification,
    PlacementApplication,
    UserProfile,
    WeeklyLog,
)

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "bio",
            "avatar_url",
            "location",
            "date_of_birth",
            "created_at",
            "updated_at",
        ]


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
            "registration_number",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

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
            "registration_number",
            "password",
        ]

    def get_full_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

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
    status = serializers.SerializerMethodField(read_only=True)
    average_score = serializers.SerializerMethodField(read_only=True)
    average_weight = serializers.SerializerMethodField(read_only=True)

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
            "average_score",
            "average_weight",
        ]

    def get_status(self, obj):
        """Return computed status based on dates."""
        return obj.get_computed_status()

    def get_average_score(self, obj):
        """Return canonical average combined score for this placement across weeks.
        Uses Evaluation.weekly_summary_for_placement which already computes per-week combined
        scores and an overall average.
        """
        try:
            summary = Evaluation.weekly_summary_for_placement(obj)
            return summary.get('average')
        except Exception:
            return None

    def get_average_weight(self, obj):
        """Return the average grade weight across all weeks for this placement."""
        try:
            summary = Evaluation.weekly_summary_for_placement(obj)
            weeks = summary.get('weeks') or []
            weights = [Decimal(str(week.get('grade_weight', 0) or 0)) for week in weeks if week.get('grade_weight') is not None]
            if not weights:
                return None
            return float(round((sum(weights) / len(weights)), 2))
        except Exception:
            return None

    def validate(self, attrs):
        placement = getattr(self, "instance", None)
        student = attrs.get("student") or getattr(placement, "student", None)
        start_date = attrs.get("start_date") or getattr(placement, "start_date", None)
        end_date = attrs.get("end_date") or getattr(placement, "end_date", None)

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
        if not obj.student:
            return ""
        return CustomUserSerializer(obj.student).data["full_name"]

    def get_workplace_supervisor_name(self, obj):
        if not obj.workplace_supervisor:
            return ""
        return CustomUserSerializer(obj.workplace_supervisor).data["full_name"]

    def get_academic_supervisor_name(self, obj):
        if not obj.academic_supervisor:
            return ""
        return CustomUserSerializer(obj.academic_supervisor).data["full_name"]

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
            raise serializers.ValidationError({"end_date": ["End date must be on or after the start date."]})

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
    deadline = serializers.DateField(read_only=True)

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

    def validate(self, attrs):
        placement = attrs.get('placement') or getattr(self.instance, 'placement', None)
        week_number = attrs.get('week_number') if attrs.get('week_number') is not None else getattr(self.instance, 'week_number', None)
        request = self.context.get('request')

        # Auto-assign week_number on creation when not provided by client
        if request and request.method == 'POST' and week_number is None:
            if not placement:
                raise serializers.ValidationError({'placement_id': ['Placement is required to determine current week.']})
            start_date = placement.start_date
            if not start_date:
                raise serializers.ValidationError({'placement_id': ['Placement must have a start date.']})
            today = timezone.now().date()
            end_date = placement.end_date
            effective = end_date if end_date and end_date < today else today
            days_elapsed = max(0, (effective - start_date).days)
            current_week = max(1, (days_elapsed // 7) + 1)
            attrs['week_number'] = current_week
            week_number = current_week

        if not placement:
            raise serializers.ValidationError({'placement_id': ['Placement is required.']})

        if request and placement.student_id != request.user.id and request.user.role != 'admin':
            raise serializers.ValidationError({'placement_id': ['You can only create or edit logs for your own placement.']})

        if week_number is None:
            raise serializers.ValidationError({'week_number': ['Week number is required.']})

        if self.instance and self.instance.status == 'approved':
            raise serializers.ValidationError({'status': ['No editing logs after approval']})

        if placement.get_computed_status() == 'completed' and attrs.get('status', getattr(self.instance, 'status', None)) == 'submitted':
            raise serializers.ValidationError({'status': ['Cannot submit a weekly log for a completed placement.']})

        if placement and week_number is not None:
            # compute automatic deadline and current week index based on placement start
            deadline = WeeklyLog(placement=placement, week_number=week_number).calculate_deadline()
            # current effective date
            today = timezone.now().date()
            start_date = placement.start_date
            end_date = placement.end_date
            if not start_date:
                raise serializers.ValidationError({'placement_id': ['Placement must have a start date.']})
            effective = end_date if end_date and end_date < today else today
            # weeks elapsed since start: floor(days_elapsed/7)
            days_elapsed = max(0, (effective - start_date).days)
            current_week = max(1, (days_elapsed // 7) + 1)

            # prevent creating logs for future weeks
            if week_number > current_week:
                raise serializers.ValidationError({'week_number': ['Cannot create a log for a future week.']})

            # prevent submitting logs for previous weeks once the current week advanced
            # allow saving drafts for past weeks but disallow submission
            if request and request.method == 'POST' and attrs.get('status') == 'submitted':
                if week_number < current_week:
                    raise serializers.ValidationError({'week_number': ['Cannot submit a log for a previous week; missed weeks are recorded automatically as zero.']})

            # existing deadline check
            if request and request.method == 'POST' and deadline and timezone.now().date() > deadline:
                raise serializers.ValidationError({'deadline': ['Cannot submit after deadline']})

        if self.instance is None and WeeklyLog.objects.filter(placement=placement, week_number=week_number).exists():
            raise serializers.ValidationError({'week_number': ['A weekly log for this placement and week already exists.']})

        return attrs


class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = "__all__"


class EvaluationItemSerializer(serializers.ModelSerializer):
    criteria = EvaluationCriteriaSerializer(read_only=True)
    criteria_id = serializers.PrimaryKeyRelatedField(
        source='criteria',
        queryset=EvaluationCriteria.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = EvaluationItem
        fields = [
            'id',
            'evaluation',
            'criteria',
            'criteria_id',
            'score',
        ]

    def validate(self, attrs):
        criteria = attrs.get('criteria')
        score = attrs.get('score')
        
        if criteria and score is not None:
            if score > criteria.max_score:
                raise serializers.ValidationError({
                    'score': f'Score cannot exceed maximum score of {criteria.max_score}'
                })
            if score < 0:
                raise serializers.ValidationError({
                    'score': 'Score cannot be negative'
                })
        
        return attrs


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
    items = serializers.SerializerMethodField(read_only=True)
    week_number = serializers.IntegerField(required=True)
    score = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "placement",
            "placement_id",
            "evaluator",
            "evaluator_id",
            "evaluator_name",
            "items",
            "week_number",
            "score",
            "weighted_score",
            "evaluation_type",
            "evaluated_at",
        ]
        extra_kwargs = {
            "evaluation_type": {"default": "supervisor"},
            "placement": {"required": True},
            "weighted_score": {"read_only": True},
        }

    def get_evaluator_name(self, obj):
        return CustomUserSerializer(obj.evaluator).data["full_name"]

    def get_items(self, obj):
        """Return evaluation items using the correct related_name"""
        return EvaluationItemSerializer(obj.evaluation_items.all(), many=True).data

    def validate(self, attrs):
        placement = attrs.get("placement") or getattr(self.instance, "placement", None)
        evaluation_type = attrs.get("evaluation_type") or getattr(self.instance, "evaluation_type", None)
        week_number = attrs.get('week_number') if attrs.get('week_number') is not None else getattr(self.instance, 'week_number', None)
        request = self.context.get('request')

        if request and request.user.role in ['workplace_supervisor', 'academic_supervisor']:
            expected_type = 'supervisor' if request.user.role == 'workplace_supervisor' else 'academic'
            attrs['evaluation_type'] = expected_type
            evaluation_type = expected_type

        if placement and evaluation_type and week_number:
            # Ensure weekly log exists for this placement/week
            if not WeeklyLog.objects.filter(placement=placement, week_number=week_number).exists():
                raise serializers.ValidationError({'week_number': ['Weekly log for this placement and week does not exist.']})

            duplicate_qs = Evaluation.objects.filter(
                placement=placement,
                evaluation_type=evaluation_type,
                week_number=week_number,
            )
            if self.instance:
                duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)

            if duplicate_qs.exists():
                raise serializers.ValidationError(
                    {
                        "evaluation_type": [
                            "Only one evaluation can be created for this student and supervisor type."
                        ]
                    }
                )

        return attrs

    def create(self, validated_data):
        # Allow nested evaluation items via initial data
        request = self.context.get('request')
        items_data = None
        if request is not None:
            items_data = request.data.get('items')

        # Default evaluator to request.user when not provided
        if 'evaluator' not in validated_data and request is not None:
            validated_data['evaluator'] = request.user

        evaluation = Evaluation.objects.create(**validated_data)

        if items_data and isinstance(items_data, list):
            for item in items_data:
                crit_id = item.get('criteria_id') or item.get('criteria')
                score = item.get('score', 0)
                try:
                    crit = EvaluationCriteria.objects.get(pk=crit_id)
                    EvaluationItem.objects.create(evaluation=evaluation, criteria=crit, score=score)
                except EvaluationCriteria.DoesNotExist:
                    continue

        # Recalculate score if items created
        try:
            evaluation.update_score_from_items()
        except Exception:
            pass

        return evaluation

    def update(self, instance, validated_data):
        request = self.context.get('request')
        items_data = None
        if request is not None:
            items_data = request.data.get('items')

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None and isinstance(items_data, list):
            # Replace existing items with provided ones for simplicity
            instance.evaluation_items.all().delete()
            for item in items_data:
                crit_id = item.get('criteria_id') or item.get('criteria')
                score = item.get('score', 0)
                try:
                    crit = EvaluationCriteria.objects.get(pk=crit_id)
                    EvaluationItem.objects.create(evaluation=instance, criteria=crit, score=score)
                except EvaluationCriteria.DoesNotExist:
                    continue

        try:
            instance.update_score_from_items()
        except Exception:
            pass

        return instance


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