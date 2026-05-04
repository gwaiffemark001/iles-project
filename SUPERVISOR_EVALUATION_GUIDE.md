# Supervisor Evaluation System - Implementation Guide

## Overview

The supervisor evaluation system allows both academic and workplace supervisors to evaluate assigned students based on admin-defined evaluation criteria. The system calculates weighted scores for each student and displays aggregated results.

## Features Implemented

### 1. **Dynamic Evaluation Criteria**
- Administrators define evaluation criteria with:
  - Name and description
  - Maximum possible score (max_score)
  - Weight percentage (weight_percent) for weighted calculation
- Criteria are stored in the `EvaluationCriteria` model
- Total weight across all criteria should equal 100%

### 2. **Per-Criteria Scoring**
- Both academic and workplace supervisors can submit evaluations
- Each evaluation contains multiple `EvaluationItem` records
- Each item stores:
  - Reference to the evaluation
  - Reference to a specific criteria
  - Score (0 to criteria.max_score)
- Unique constraint: One score per (evaluation, criteria) pair

### 3. **Weighted Score Calculation**
- Total evaluation score is calculated using the formula:
  ```
  total_score = sum((item_score / criteria.max_score) * criteria.weight_percent)
  ```
- Results in a score from 0-100 (representing weighted average)
- Calculated both on backend (save) and frontend (display)

### 4. **Supervisor Dashboards**
Both supervisor types have integrated evaluation UI:

**Workplace Supervisor Dashboard:**
- Tab: "Evaluations"
- Cards for each assigned intern showing:
  - Student name and company
  - Current evaluation score (if exists)
  - Evaluation date
  - "Add Evaluation" or "Edit Evaluation" button
  - Interactive form to score criteria

**Academic Supervisor Dashboard:**
- Section: "Assigned Students"
- Can click "Evaluate Student" button
- Same evaluation form appears
- Form automatically uses evaluation_type='academic'

### 5. **Evaluation Form (SupervisorEvaluationForm)**
The reusable form component provides:
- Auto-loads criteria from admin configuration
- Input field for each criteria (score 0 to max_score)
- Real-time percentage calculation per criteria:
  - Green: ≥70% of max_score
  - Yellow: ≥50% of max_score
  - Red: <50% of max_score
- Total weighted score display
- Form validation:
  - All criteria must have scores
  - Scores must be within valid range
- Error messages displayed in form
- Save/Cancel buttons
- Shows "Saving..." during submission
- Updates on successful save with toast notification

## API Endpoints

### Create/Update Evaluation
**POST** `/api/evaluations/`
```json
{
  "placement_id": 123,
  "evaluator_id": 456,
  "evaluation_type": "supervisor",  // or "academic"
  "score": 75.50,
  "items": [
    {"criteria_id": 1, "score": 18},
    {"criteria_id": 2, "score": 20},
    {"criteria_id": 3, "score": 15}
  ]
}
```

**PUT** `/api/evaluations/{id}/`
- Same payload structure as POST
- Updates existing evaluation and recalculates score

### Get Criteria
**GET** `/api/criteria/`
```json
[
  {
    "id": 1,
    "name": "Technical Skills",
    "description": "Ability to apply technical knowledge",
    "max_score": 20,
    "weight_percent": 40
  },
  {
    "id": 2,
    "name": "Communication",
    "description": "Clear and effective communication",
    "max_score": 20,
    "weight_percent": 30
  }
]
```

## File Structure

```
iles_frontend/
├── src/
│   ├── pages/
│   │   ├── components/
│   │   │   └── SupervisorEvaluationForm.jsx  (Reusable form)
│   │   ├── AcademicSupervisor/
│   │   │   └── AcademicSupervisorDashboard.jsx (Integrated form)
│   │   └── WorkplaceSupervisor/
│   │       └── WorkplaceSupervisorDashboard.jsx (Integrated form)
│   └── api/
│       └── api.js  (criteriaAPI, evaluationsAPI helpers)

iles_backend/
├── core/
│   ├── models.py  (EvaluationCriteria, Evaluation, EvaluationItem)
│   ├── serializers.py  (Nested serializers with score calculation)
│   ├── views.py  (API endpoints)
```

## Key Models

### EvaluationCriteria
```python
class EvaluationCriteria(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)
    weight_percent = models.DecimalField(max_digits=5, decimal_places=2)
```

### Evaluation
```python
class Evaluation(models.Model):
    placement = ForeignKey(InternshipPlacement)
    evaluator = ForeignKey(CustomUser)
    evaluation_type = CharField(choices=['academic', 'supervisor', 'logbook'])
    score = DecimalField()  # Calculated from items
    evaluated_at = DateTimeField(auto_now=True)
```

### EvaluationItem
```python
class EvaluationItem(models.Model):
    evaluation = ForeignKey(Evaluation)
    criteria = ForeignKey(EvaluationCriteria)
    score = DecimalField()
    class Meta:
        unique_together = [('evaluation', 'criteria')]
```

## Usage Example

### For Workplace Supervisor
1. Navigate to "Evaluations" tab
2. Find student to evaluate
3. Click "Add Evaluation" or "Edit Evaluation"
4. Form loads with criteria defined by admin
5. Enter score for each criteria (0 to max_score)
6. Form shows real-time percentage for each criterion
7. Total score calculated automatically
8. Click "Save Evaluation"
9. Success message and form closes
10. Evaluation score now visible on card

### For Academic Supervisor
1. Navigate to "Assigned Students" section
2. Select a student
3. Click "Evaluate Student" button
4. Same form appears as above
5. Evaluation type automatically set to 'academic'
6. Submit and view updated score

### For Administrator
1. Set up evaluation criteria in admin dashboard
2. Define criteria names, descriptions, max scores, weights
3. Criteria becomes available for supervisors
4. View all evaluations submitted by supervisors
5. See per-student breakdowns by criteria

## Error Handling

**Frontend Validation:**
- All criteria must have scores (not 0)
- Scores must be within 0 to max_score
- Form shows error banner if validation fails
- Submit button disabled during request

**Backend Validation:**
- User must be authenticated
- User must have supervisor role
- All items must reference valid criteria
- Scores must be within valid ranges
- Serializer validates and returns errors

## Score Calculation Examples

**Example 1:** Two criteria, equal weight
- Criteria 1: max=20, weight=50%, entered score=16
  - Contribution: (16/20) * 50 = 40
- Criteria 2: max=20, weight=50%, entered score=14
  - Contribution: (14/20) * 50 = 35
- **Total Score: 40 + 35 = 75**

**Example 2:** Three criteria, different weights
- Criteria 1: max=20, weight=40%, score=18 → (18/20)*40 = 36
- Criteria 2: max=20, weight=35%, score=16 → (16/20)*35 = 28
- Criteria 3: max=20, weight=25%, score=15 → (15/20)*25 = 18.75
- **Total Score: 36 + 28 + 18.75 = 82.75**

## Testing Checklist

- [ ] Admin can create evaluation criteria
- [ ] Admin can edit criteria
- [ ] Admin can delete criteria
- [ ] Workplace supervisor can see evaluations tab
- [ ] Workplace supervisor can add evaluation
- [ ] Workplace supervisor can edit evaluation
- [ ] Academic supervisor can evaluate student
- [ ] Form shows all admin-defined criteria
- [ ] Score validation works (0 to max_score)
- [ ] Weighted score calculation correct
- [ ] Percentage indicators show correct colors
- [ ] Total score updates in real-time
- [ ] Success toast shown after save
- [ ] Form closes after save
- [ ] Dashboard data refreshes after save
- [ ] Evaluations persist in database
- [ ] Multiple evaluators can evaluate same student

## Future Enhancements

1. **Evaluation Comments/Feedback**
   - Add textarea for supervisor to provide qualitative feedback
   - Store in new EvaluationComment model

2. **Score History/Revision Tracking**
   - Track when evaluations were modified
   - Allow viewing previous versions

3. **Results Report**
   - Tab showing all students' aggregated scores
   - Filter by placement, department, period
   - Export to CSV/PDF

4. **Self-Evaluation**
   - Students can evaluate themselves on same criteria
   - Compare self-evaluation vs supervisor evaluation

5. **Evaluation Templates**
   - Save common criteria sets as reusable templates
   - Admin applies template to multiple placements

6. **Notifications**
   - Email supervisors when criteria are defined
   - Notify students when evaluation is complete
   - Reminder notifications for pending evaluations

## Performance Considerations

- Criteria loaded once on form mount
- Criteria cache in component state
- Score calculation on every input change (client-side only)
- Database score saved on form submit
- Proper cleanup of async operations with mounted flags

## Security

- All endpoints require authentication
- Supervisors can only evaluate assigned placements
- Admin only can create/edit criteria
- Students cannot access evaluation creation
- Backend validation of all inputs
- CSRF protection via Django
