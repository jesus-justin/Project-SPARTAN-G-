export function classifyDASSRisk({ depression, anxiety, stress }) {
  const max = Math.max(depression, anxiety, stress);

  if (max >= 28) return 'High';
  if (max >= 19) return 'Moderate';
  return 'Low';
}

export function mergeRiskLevels(...levels) {
  const order = ['Low', 'Moderate', 'High', 'Crisis'];
  return levels.reduce((current, level) => {
    if (!level) return current;
    return order.indexOf(level) > order.indexOf(current) ? level : current;
  }, 'Low');
}

export function classifyComprehensiveRisk(data) {
  const {
    dass21Score = null,
    dass21Subscales = {},
    phq9Score = null,
    phq9Severity = null,
    gad7Score = null,
    gad7Severity = null,
    trajectory = 'Stable',
    cssrsItem3 = false,
  } = data;

  // CRISIS: Always deterministic based on C-SSRS or Extremely Severe DASS-21
  if (cssrsItem3 || dass21Score >= 84) {
    return { riskLevel: 'Crisis', drivers: generateShapDrivers(data, 'Crisis') };
  }

  // HIGH: Any Severe on instruments OR At-Risk trajectory
  if (
    phq9Severity === 'Severe' ||
    gad7Severity === 'Severe' ||
    trajectory === 'At-Risk' ||
    dass21Score >= 45 ||
    (dass21Subscales.depression >= 28 || dass21Subscales.anxiety >= 19 || dass21Subscales.stress >= 33)
  ) {
    return { riskLevel: 'High', drivers: generateShapDrivers(data, 'High') };
  }

  // MODERATE: Any Mild/Moderate OR Deteriorating trajectory
  if (
    phq9Severity === 'Moderate' ||
    phq9Severity === 'Moderately Severe' ||
    gad7Severity === 'Moderate' ||
    gad7Severity === 'Severe' ||
    trajectory === 'Deteriorating' ||
    dass21Score >= 28 ||
    dass21Subscales.depression >= 20 ||
    dass21Subscales.anxiety >= 14 ||
    dass21Subscales.stress >= 25
  ) {
    return { riskLevel: 'Moderate', drivers: generateShapDrivers(data, 'Moderate') };
  }

  // LOW: All instruments Normal/None/Minimal and Stable
  return { riskLevel: 'Low', drivers: generateShapDrivers(data, 'Low') };
}

function generateShapDrivers(data, riskLevel) {
  const drivers = [];

  const {
    dass21Score = 0,
    dass21Subscales = {},
    phq9Score = 0,
    phq9Severity = null,
    gad7Score = 0,
    gad7Severity = null,
    trajectory = 'Stable',
    moodSlope = 0,
    energySlope = 0,
  } = data;

  // Add DASS-21 subscales if significant
  if (dass21Subscales.depression >= 20) {
    drivers.push({
      feature: 'Depression (DASS-21)',
      value: dass21Subscales.depression,
      impact: dass21Subscales.depression >= 28 ? 'CRITICAL' : 'HIGH',
    });
  }
  if (dass21Subscales.anxiety >= 14) {
    drivers.push({
      feature: 'Anxiety (DASS-21)',
      value: dass21Subscales.anxiety,
      impact: dass21Subscales.anxiety >= 19 ? 'CRITICAL' : 'HIGH',
    });
  }
  if (dass21Subscales.stress >= 25) {
    drivers.push({
      feature: 'Stress (DASS-21)',
      value: dass21Subscales.stress,
      impact: dass21Subscales.stress >= 33 ? 'CRITICAL' : 'HIGH',
    });
  }

  // Add PHQ-9 if elevated
  if (phq9Score >= 10) {
    drivers.push({
      feature: `Depression (PHQ-9 - ${phq9Severity})`,
      value: phq9Score,
      impact: phq9Severity === 'Severe' || phq9Severity === 'Moderately Severe' ? 'HIGH' : 'MODERATE',
    });
  }

  // Add GAD-7 if elevated
  if (gad7Score >= 10) {
    drivers.push({
      feature: `Anxiety (GAD-7 - ${gad7Severity})`,
      value: gad7Score,
      impact: gad7Severity === 'Severe' ? 'HIGH' : 'MODERATE',
    });
  }

  // Add trajectory if concerning
  if (trajectory !== 'Stable') {
    drivers.push({
      feature: `Mood Trajectory (${trajectory})`,
      value: moodSlope,
      impact: trajectory === 'At-Risk' ? 'HIGH' : 'MODERATE',
    });
  }

  // Sort by impact and take top 3
  const impactOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
  drivers.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return drivers.slice(0, 3);
}

