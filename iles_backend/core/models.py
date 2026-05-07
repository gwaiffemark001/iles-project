from django.core.exceptions import ValidationError
from django.db import models
from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class CustomUser(AbstractUser):
    ROLE_CHOICES =[
        ('student', 'Student Intern'),
        ('workplace_supervisor', 'Workplace Supervisor'),
        ('academic_supervisor', 'Academic Supervisor'),
        ('admin', 'Administrator'),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='student')
    phone= models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    staff_number= models.CharField(max_length=20, blank=True, null=True)
    student_number=models.CharField(max_length=20, blank=True, null=True)
    registration_number = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        return (f"{self.username},({self.role})")


class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=120, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class InternshipPlacement(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active' ,'Active'),
        ('completed', 'Completed'),       
    ]    
    # When student is null, treat this as an "available" placement/posting.
    student =models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role':'student'},
        blank=True,
        null=True,
    )
    workplace_supervisor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='supervised_placements',limit_choices_to ={'role':'workplace_supervisor'})
    academic_supervisor = models.ForeignKey(CustomUser, on_delete= models.CASCADE, related_name='academic_placements', limit_choices_to={'role':'academic_supervisor'})
    company_name =models.CharField(max_length=200)
    company_address = models.TextField(blank=True, null=True)
    start_date =models.DateField()
    end_date =models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add =True)

    def get_computed_status(self):
        """Compute placement status based on current date and start/end dates."""
        from datetime import date
        today = date.today()
        
        # If no student assigned yet, status is pending
        if not self.student:
            return 'pending'
        
        # If today is before start date, still pending
        if today < self.start_date:
            return 'pending'
        
        # If today is on or after end date, placement is completed
        if today >= self.end_date:
            return 'completed'
        
        # Otherwise (between start and end dates), placement is active
        return 'active'

    def __str__(self):
        student_username = self.student.username if self.student else "Unassigned"
        return (f"{student_username} at {self.company_name}")

    def clean(self):
        """Validate placement data to prevent overlapping internships"""
        # A student can only have one placement record.
        if self.student:
            existing_placements = InternshipPlacement.objects.filter(student=self.student).exclude(pk=self.pk)
            if existing_placements.exists():
                raise ValidationError({
                    'student': 'A student can only have one placement.'
                })
        
        # Validate date logic
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({
                'end_date': 'End date must be after start date.'
            })

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student'],
                condition=models.Q(student__isnull=False),
                name='unique_student_placement',
            )
        ]

    def save(self, *args, **kwargs):
        """Override save to include validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class PlacementApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    placement = models.ForeignKey(
        InternshipPlacement,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='placement_applications',
        limit_choices_to={'role': 'student'},
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = [['placement', 'student']]

    def __str__(self):
        return f"{self.student.username} -> {self.placement.company_name} ({self.status})"

class WeeklyLog(models.Model):
    STATUS_CHOICES =[
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved','Approved'),
        ('rejected', 'Rejected'),
    ]
    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='logs')
    week_number = models.PositiveIntegerField()
    activities = models.TextField()
    challenges = models.TextField(blank=True, null=True)
    learning = models.TextField(blank=True, null=True)
    status= models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    supervisor_comment = models.TextField(blank=True, null=True)
    deadline= models.DateField()
    submitted_at =models.DateTimeField(blank=True, null=True)
    reviewed_at =models.DateTimeField(blank=True, null=True)
    approved_at =models.DateTimeField(blank=True, null=True)
    rejected_at =models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Audit fields for tracking review actions
    reviewed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_logs',
        limit_choices_to={'role__in': ['workplace_supervisor', 'academic_supervisor']}
    )
    
    def can_edit(self):
        """Check if log can be edited based on status"""
        return self.status in ['draft', 'submitted']

    def calculate_deadline(self):
        """Return the automatic deadline for this week based on placement dates."""
        from datetime import timedelta

        if not self.placement_id or not self.week_number:
            return self.deadline

        placement_start = self.placement.start_date
        placement_end = self.placement.end_date
        computed_deadline = placement_start + timedelta(days=(int(self.week_number) * 7) - 1)
        if placement_end and computed_deadline > placement_end:
            computed_deadline = placement_end
        return computed_deadline

    def refresh_deadline(self):
        self.deadline = self.calculate_deadline()
        return self.deadline
    
    def is_overdue(self):
        """Check if log submission is overdue"""
        from django.utils import timezone
        return self.deadline < timezone.now().date() and self.status != 'approved'

    def clean(self):
        super().clean()

        if self.placement_id and self.week_number:
            self.deadline = self.calculate_deadline()

        if self.pk:
            previous = WeeklyLog.objects.filter(pk=self.pk).first()
            if previous and previous.status == 'approved':
                raise ValidationError({'status': 'No editing logs after approval'})

        if self.deadline and self.deadline < self.placement.start_date:
            raise ValidationError({'deadline': 'Deadline cannot be before placement start date.'})

    def save(self, *args, **kwargs):
        self.refresh_deadline()
        self.full_clean()
        super().save(*args, **kwargs)
    
    class Meta:
        unique_together =[['placement', 'week_number']]
        ordering = ['week_number']

    def __str__(self):
        student_username = self.placement.student.username if self.placement.student else "Unknown"
        return (f"Week {self.week_number}-{student_username} ({self.status})")
    
class EvaluationCriteria(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    max_score =models.DecimalField(max_digits=5, decimal_places=2)
    weight_percent=models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.0'))
    # How the criterion's weight is split between supervisors.
    # These represent the share of the criterion's weight assigned to each role (values are percentages and should sum to 100).
    supervisor_share = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('40.0'))
    academic_share = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('60.0'))

    def clean(self):
        super().clean()
        total = Decimal(str(self.supervisor_share)) + Decimal(str(self.academic_share))
        if total != Decimal('100'):
            raise ValidationError({'supervisor_share': 'supervisor_share + academic_share must equal 100'})

    def save(self, *args, **kwargs):
        self.full_clean()
        result = super().save(*args, **kwargs)
        self.__class__.rebalance_weights()
        return result

    def delete(self, *args, **kwargs):
        result = super().delete(*args, **kwargs)
        self.__class__.rebalance_weights()
        return result

    @classmethod
    def rebalance_weights(cls):
        criteria = list(cls.objects.order_by('id').only('id'))
        total_criteria = len(criteria)

        if total_criteria == 0:
            return

        base_weight = (Decimal('100') / Decimal(total_criteria)).quantize(Decimal('0.01'))
        assigned = Decimal('0.00')

        for index, criterion in enumerate(criteria):
            if index == total_criteria - 1:
                weight = Decimal('100.00') - assigned
            else:
                weight = base_weight
                assigned += weight

            cls.objects.filter(pk=criterion.pk).update(weight_percent=weight)

    def __str__(self):
        return f"{self.name} - {self.weight_percent}% weight"
    
class Evaluation(models.Model):
    EVALUATION_TYPES = [
        ('supervisor', 'Supervisor Assessment'),
        ('academic', 'Academic Assessment'),
    ]

    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='given_evaluations')

    # Link evaluation to a week (one evaluation per placement/evaluation_type/week)
    week_number = models.PositiveIntegerField(default=1)

    # Optional raw evaluator score (0-100 scale) and computed weighted score stored here
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Evaluator raw score (0-100)")
    weighted_score = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Computed weighted score")
    evaluation_type = models.CharField(max_length=20, choices=EVALUATION_TYPES, default='supervisor')
    evaluated_at = models.DateTimeField(auto_now_add=True)
    
    def calculate_weighted_score(self):
        """Calculate weighted score from related EvaluationItem entries"""
        try:
            # Use the declared related_name from EvaluationItem model
            items_qs = getattr(self, 'evaluation_items', None)
            if items_qs is None:
                items_qs = []
            else:
                items_qs = items_qs.all() if hasattr(items_qs, 'all') else []
        except (AttributeError, Exception):
            items_qs = []

        # Special-case: supervisor evaluations use fixed three-category weights if those items exist
        try:
            if self.evaluation_type == 'supervisor' and items_qs:
                # Map expected criteria names to their weights (percent out of 100)
                name_to_weight = {
                    'Technical Skills': Decimal('0.4'),
                    'Communication': Decimal('0.3'),
                    'Professionalism': Decimal('0.3'),
                }
                found = {name: None for name in name_to_weight.keys()}
                for item in items_qs:
                    crit_name = (item.criteria.name or '').strip()
                    if crit_name in found:
                        # Normalize score to 0-100 if max_score provided
                        try:
                            max_s = Decimal(str(item.criteria.max_score)) if item.criteria.max_score else Decimal('100')
                            score_val = (Decimal(str(item.score)) / max_s) * Decimal('100')
                        except Exception:
                            score_val = Decimal(str(item.score))
                        found[crit_name] = score_val

                # Only compute special weighted score if all three categories present
                if all(found[name] is not None for name in name_to_weight):
                    total_score = Decimal('0')
                    for name, weight in name_to_weight.items():
                        total_score += (found[name] * weight)
                    return float(round(total_score, 2))
        except Exception:
            pass

        # Generic per-criteria weighted percent fallback (uses the evaluator role share)
        total = Decimal('0')
        for item in items_qs:
            crit = item.criteria
            try:
                if crit.max_score and crit.max_score > 0:
                    role_share = crit.supervisor_share if self.evaluation_type == 'supervisor' else crit.academic_share
                    contribution = (Decimal(str(item.score)) / Decimal(str(crit.max_score))) * Decimal(str(role_share))
                else:
                    contribution = Decimal('0')
            except Exception:
                contribution = Decimal('0')
            total += Decimal(str(contribution))

        return float(round(total, 2))

    def update_score_from_items(self):
        """Recalculate `weighted_score` from EvaluationItem entries and save the model."""
        calculated = self.calculate_weighted_score()
        self.weighted_score = calculated
        self.save(update_fields=['weighted_score'])

    class Meta:
        unique_together = [['placement', 'evaluation_type', 'week_number']]
        ordering = ['-evaluated_at']

    def __str__(self):
        student_username = self.placement.student.username if self.placement.student else "Unknown"
        return f"{student_username} - {self.evaluation_type}: {self.weighted_score}"

    @staticmethod
    def combined_score_for_week(placement, week_number):
        """
        Calculate the combined total score for a placement for a given week by
        combining the academic and supervisor evaluations according to
        the shares configured on each EvaluationCriteria.

        Returns a dict with per-role scores and the combined total.
        """
        from django.db.models import Q

        log = WeeklyLog.objects.filter(placement=placement, week_number=week_number).first()
        if log is None:
            deadline = WeeklyLog(placement=placement, week_number=week_number).calculate_deadline()
            if deadline and timezone.now().date() > deadline:
                return {
                    'week_number': week_number,
                    'supervisor_score': 0.0,
                    'academic_score': 0.0,
                    'combined_score': 0.0,
                    'criteria_breakdown': [],
                    'log_status': 'missing',
                    'missing_log': True,
                }

            return {
                'week_number': week_number,
                'supervisor_score': None,
                'academic_score': None,
                'combined_score': 0.0,
                'criteria_breakdown': [],
                'log_status': 'pending',
                'missing_log': False,
            }

        sup_eval = Evaluation.objects.filter(
            placement=placement, evaluation_type='supervisor', week_number=week_number
        ).first()
        acad_eval = Evaluation.objects.filter(
            placement=placement, evaluation_type='academic', week_number=week_number
        ).first()

        # Load all criteria
        criteria = EvaluationCriteria.objects.all()

        total = Decimal('0')
            # Track per-role totals (weighted by the evaluator role share for each criterion)
        sup_total = None
        acad_total = None

        # per-criterion breakdown
        crit_breakdown = []

        # If we have evaluator-level totals stored (score field), we can use them as fallback
        if sup_eval:
            try:
                sup_total = Decimal(str(sup_eval.score))
            except Exception:
                sup_total = None
        if acad_eval:
            try:
                acad_total = Decimal(str(acad_eval.score))
            except Exception:
                acad_total = None

        # Best-effort combined per-criteria calculation using item-level scores when available
        for crit in criteria:
            crit_contrib = Decimal('0')
            sup_score_val = None
            acad_score_val = None
            sup_contribution = Decimal('0')
            acad_contribution = Decimal('0')
            crit_id = getattr(crit, 'id', None)
            sup_items = getattr(sup_eval, 'evaluation_items', None) if sup_eval else None
            acad_items = getattr(acad_eval, 'evaluation_items', None) if acad_eval else None

            # supervisor contribution for this criterion
            if sup_items is not None:
                try:
                    sup_item = sup_items.get(criteria=crit)
                    if crit.max_score and crit.max_score > 0:
                        sup_score = Decimal(str(sup_item.score))
                        sup_score_val = float(sup_score)
                        sup_contribution = (sup_score / Decimal(str(crit.max_score))) * Decimal(str(crit.supervisor_share))
                        crit_contrib += sup_contribution
                except EvaluationItem.DoesNotExist:
                    pass
            # academic contribution for this criterion
            if acad_items is not None:
                try:
                    acad_item = acad_items.get(criteria=crit)
                    if crit.max_score and crit.max_score > 0:
                        acad_score = Decimal(str(acad_item.score))
                        acad_score_val = float(acad_score)
                        acad_contribution = (acad_score / Decimal(str(crit.max_score))) * Decimal(str(crit.academic_share))
                        crit_contrib += acad_contribution
                except EvaluationItem.DoesNotExist:
                    pass

            total += crit_contrib

            crit_breakdown.append({
                'criteria_id': crit_id,
                'criteria_name': crit.name,
                'max_score': float(crit.max_score),
                'weight_percent': float(crit.weight_percent),
                'supervisor_score': sup_score_val,
                'academic_score': acad_score_val,
                'supervisor_contribution': float(round(sup_contribution, 2)) if sup_contribution else 0.0,
                'academic_contribution': float(round(acad_contribution, 2)) if acad_contribution else 0.0,
                'total_contribution': float(round(crit_contrib, 2)),
            })

        # If no item-level data was present but evaluator totals exist, combine them via a simple share across roles
        if total == Decimal('0') and (sup_total is not None or acad_total is not None):
            # Determine global role split by averaging shares across criteria (fallback)
            avg_sup_share = Decimal('0')
            avg_acad_share = Decimal('0')
            crit_count = criteria.count() or 1
            for crit in criteria:
                avg_sup_share += Decimal(str(crit.supervisor_share))
                avg_acad_share += Decimal(str(crit.academic_share))
            avg_sup_share = (avg_sup_share / crit_count) / Decimal('100')
            avg_acad_share = (avg_acad_share / crit_count) / Decimal('100')

            # Use evaluator totals (assumed to be 0-100 scale)
            sup_val = sup_total if sup_total is not None else Decimal('0')
            acad_val = acad_total if acad_total is not None else Decimal('0')
            total = (sup_val * avg_sup_share) + (acad_val * avg_acad_share)

            # When using evaluator-level fallback, provide a minimal breakdown per criterion using averaged shares
            crit_breakdown = []
            for crit in criteria:
                crit_id = getattr(crit, 'id', None)
                sup_contr = float(round((sup_val / Decimal(str(crit.max_score))) * Decimal(str(crit.supervisor_share)), 2)) if sup_total is not None else 0.0
                acad_contr = float(round((acad_val / Decimal(str(crit.max_score))) * Decimal(str(crit.academic_share)), 2)) if acad_total is not None else 0.0
                crit_breakdown.append({
                    'criteria_id': crit_id,
                    'criteria_name': crit.name,
                    'max_score': float(crit.max_score),
                    'weight_percent': float(crit.weight_percent),
                    'supervisor_score': float(sup_val) if sup_total is not None else None,
                    'academic_score': float(acad_val) if acad_total is not None else None,
                    'supervisor_contribution': sup_contr,
                    'academic_contribution': acad_contr,
                    'total_contribution': float(round((sup_contr + acad_contr), 2)),
                })

        return {
            'week_number': week_number,
            'supervisor_score': float(sup_total) if sup_total is not None else None,
            'academic_score': float(acad_total) if acad_total is not None else None,
            'combined_score': float(round(total, 2)),
            'criteria_breakdown': crit_breakdown,
            'log_status': log.status,
            'missing_log': False,
        }

    @staticmethod
    def weekly_summary_for_placement(placement):
        """
        Return a list of weekly combined summaries and an overall average for the placement.
        """
        # Collect all week numbers for which we have logs or evaluations
        week_numbers = set()
        for log in placement.logs.all():
            week_numbers.add(log.week_number)
        for ev in placement.evaluations.all():
            week_numbers.add(ev.week_number)

        today = timezone.now().date()
        if placement.start_date and placement.end_date:
            total_days = max(1, (placement.end_date - placement.start_date).days + 1)
            total_weeks = max(1, ((total_days - 1) // 7) + 1)
            if placement.get_computed_status() == 'completed':
                week_numbers.update(range(1, total_weeks + 1))
            elif today >= placement.start_date:
                overdue_weeks = min(total_weeks, max(0, (today - placement.start_date).days // 7))
                week_numbers.update(range(1, overdue_weeks + 1))

        week_list = sorted(list(week_numbers))
        summaries = []
        totals = []
        for w in week_list:
            summary = Evaluation.combined_score_for_week(placement, w)
            summaries.append(summary)
            if summary.get('combined_score') is not None:
                totals.append(Decimal(str(summary['combined_score'])))

        average = float(round((sum(totals) / len(totals)), 2)) if totals else None

        return {'weeks': summaries, 'average': average}


class EvaluationItem(models.Model):
    """Stores a per-criteria score for an Evaluation."""
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE, related_name='evaluation_items')
    criteria = models.ForeignKey(EvaluationCriteria, on_delete=models.PROTECT, related_name='evaluation_items')
    score = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0'))

    class Meta:
        unique_together = [['evaluation', 'criteria']]

    def __str__(self):
        return f"{self.evaluation} - {self.criteria.name}: {self.score}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("placement_created", "Placement Created"),
        ("placement_status_updated", "Placement Status Updated"),
        ("log_submitted", "Log Submitted"),
    ]

    recipient = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name="triggered_notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(max_length=40, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


