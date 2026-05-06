export const getGradeWeight = (score) => {
  const numericScore = Number(score)

  if (Number.isNaN(numericScore)) {
    return null
  }

  if (numericScore > 80) return 5
  if (numericScore > 75) return 4.5
  if (numericScore > 70) return 4
  if (numericScore > 65) return 3.5
  if (numericScore > 60) return 3
  if (numericScore > 55) return 2.5
  if (numericScore > 50) return 2
  if (numericScore > 30) return 1
  return 0
}

const getEvaluationItems = (evaluation) => Array.isArray(evaluation?.items) ? evaluation.items : []

const MS_PER_DAY = 24 * 60 * 60 * 1000

const parseDate = (value) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getPlacementTotalWeeks = (placement) => {
  const startDate = parseDate(placement?.start_date)
  const endDate = parseDate(placement?.end_date)

  if (!startDate || !endDate) {
    return 0
  }

  const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1)
  return Math.max(1, Math.ceil(totalDays / 7))
}

const getOverdueWeeks = (placement, today = new Date()) => {
  const startDate = parseDate(placement?.start_date)
  const endDate = parseDate(placement?.end_date)

  if (!startDate) {
    return 0
  }

  const effectiveDate = endDate && endDate < today ? endDate : today
  const elapsedDays = Math.max(0, Math.floor((effectiveDate.getTime() - startDate.getTime()) / MS_PER_DAY))
  return Math.max(0, Math.floor(elapsedDays / 7))
}

const calculateCombinedWeekScore = (supervisorEvaluation, academicEvaluation) => {
  const criteriaMap = new Map()

  getEvaluationItems(supervisorEvaluation).forEach((item) => {
    const criteriaId = item.criteria?.id ?? item.criteria_id
    if (criteriaId != null) {
      criteriaMap.set(criteriaId, item.criteria)
    }
  })

  getEvaluationItems(academicEvaluation).forEach((item) => {
    const criteriaId = item.criteria?.id ?? item.criteria_id
    if (criteriaId != null) {
      criteriaMap.set(criteriaId, item.criteria)
    }
  })

  let combinedScore = 0

  criteriaMap.forEach((criteria, criteriaId) => {
    if (!criteria) {
      return
    }

    const maxScore = Number(criteria.max_score || 0)
    if (maxScore <= 0) {
      return
    }

    const supervisorItem = getEvaluationItems(supervisorEvaluation).find((item) => (item.criteria?.id ?? item.criteria_id) === criteriaId)
    const academicItem = getEvaluationItems(academicEvaluation).find((item) => (item.criteria?.id ?? item.criteria_id) === criteriaId)

    const supervisorScore = Number(supervisorItem?.score ?? 0)
    const academicScore = Number(academicItem?.score ?? 0)
    const supervisorShare = Number(criteria.supervisor_share ?? 0)
    const academicShare = Number(criteria.academic_share ?? 0)
    const weightPercent = Number(criteria.weight_percent ?? 0)

    const supervisorContribution = (supervisorScore / maxScore) * weightPercent * (supervisorShare / 100)
    const academicContribution = (academicScore / maxScore) * weightPercent * (academicShare / 100)

    combinedScore += supervisorContribution + academicContribution
  })

  if (criteriaMap.size === 0) {
    const scores = []

    if (supervisorEvaluation) {
      const supervisorScore = Number(supervisorEvaluation?.score)
      if (!Number.isNaN(supervisorScore)) {
        scores.push(supervisorScore)
      }
    }

    if (academicEvaluation) {
      const academicScore = Number(academicEvaluation?.score)
      if (!Number.isNaN(academicScore)) {
        scores.push(academicScore)
      }
    }

    if (scores.length === 0) {
      return 0
    }

    combinedScore = scores.reduce((total, value) => total + value, 0) / scores.length
  }

  return Number(combinedScore.toFixed(2))
}

export const buildWeeklyEvaluationSummaries = (evaluations = [], placements = [], logs = []) => {
  const groups = new Map()
  const logLookup = new Map()

  logs.forEach((log) => {
    const placementId = log.placement?.id ?? log.placement_id
    const weekNumber = Number(log.week_number ?? 1)
    if (placementId == null || Number.isNaN(weekNumber)) {
      return
    }

    logLookup.set(`${placementId}-${weekNumber}`, log)
  })

  evaluations.forEach((evaluation) => {
    const placementId = evaluation.placement?.id ?? evaluation.placement_id
    const weekNumber = evaluation.week_number ?? 1
    if (placementId == null) {
      return
    }

    const key = `${placementId}-${weekNumber}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        placementId,
        placementName: evaluation.placement?.company_name || 'Placement not available',
        studentName:
          evaluation.placement?.student?.full_name ||
          evaluation.placement?.student?.username ||
          evaluation.student?.full_name ||
          evaluation.student?.username ||
          'Unknown Student',
        week_number: weekNumber,
        supervisorEvaluation: null,
        academicEvaluation: null,
      })
    }

    const group = groups.get(key)
    if (evaluation.evaluation_type === 'supervisor') {
      group.supervisorEvaluation = evaluation
    }
    if (evaluation.evaluation_type === 'academic') {
      group.academicEvaluation = evaluation
    }
  })

  if (Array.isArray(placements) && placements.length > 0) {
    const today = new Date()

    placements.forEach((placement) => {
      const placementId = placement?.id
      if (placementId == null) {
        return
      }

      const placementName = placement.company_name || 'Placement not available'
      const studentName =
        placement.student?.full_name ||
        placement.student?.username ||
        placement.student_name ||
        'Unknown Student'

      const existingWeeksForPlacement = Array.from(groups.values())
        .filter((entry) => Number(entry.placementId) === Number(placementId))
        .map((entry) => Number(entry.week_number || 1))

      const logWeeksForPlacement = logs
        .filter((log) => (log.placement?.id ?? log.placement_id) === placementId)
        .map((log) => Number(log.week_number || 1))

      const maxExistingWeek = Math.max(0, ...existingWeeksForPlacement, ...logWeeksForPlacement)
      const overdueWeeks = placement.status === 'completed'
        ? getPlacementTotalWeeks(placement)
        : getOverdueWeeks(placement, today)
      const weekLimit = Math.max(maxExistingWeek, overdueWeeks)

      for (let weekNumber = 1; weekNumber <= weekLimit; weekNumber += 1) {
        const key = `${placementId}-${weekNumber}`
        if (groups.has(key)) {
          const log = logLookup.get(key)
          if (log && !groups.get(key).log_status) {
            groups.get(key).log_status = log.status
          }
          continue
        }

        const log = logLookup.get(key)
        const isMissingLog = !log

        groups.set(key, {
          key,
          placementId,
          placementName,
          studentName,
          week_number: weekNumber,
          supervisorEvaluation: null,
          academicEvaluation: null,
          supervisor_score: isMissingLog ? 0 : null,
          academic_score: isMissingLog ? 0 : null,
          combined_score: 0,
          grade_weight: 0,
          log_status: isMissingLog ? 'missing' : log.status,
          missing_log: isMissingLog,
        })
      }
    })
  }

  const weeklySummaries = Array.from(groups.values())
    .map((group) => {
      const combinedScore = calculateCombinedWeekScore(group.supervisorEvaluation, group.academicEvaluation)
      return {
        ...group,
        has_evaluation: Boolean(group.supervisorEvaluation || group.academicEvaluation),
        supervisor_score: group.supervisor_score ?? group.supervisorEvaluation?.score ?? null,
        academic_score: group.academic_score ?? group.academicEvaluation?.score ?? null,
        combined_score: combinedScore,
        grade_weight: getGradeWeight(combinedScore),
      }
    })
    .sort((left, right) => right.week_number - left.week_number)

  const averageScore = weeklySummaries.length
    ? Number((weeklySummaries.reduce((total, week) => total + Number(week.combined_score || 0), 0) / weeklySummaries.length).toFixed(2))
    : null

  const averageWeight = weeklySummaries.length
    ? Number((weeklySummaries.reduce((total, week) => total + Number(week.grade_weight || 0), 0) / weeklySummaries.length).toFixed(2))
    : null

  return {
    weeklySummaries,
    averageScore,
    averageWeight,
  }
}