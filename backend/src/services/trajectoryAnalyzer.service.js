export async function analyzeTrajectory(esmEntries) {
  if (!Array.isArray(esmEntries) || esmEntries.length === 0) {
    return {
      trajectory: 'Insufficient Data',
      moodSlope: 0,
      energySlope: 0,
      validDays: 0,
    };
  }

  // Sort by created_at to get chronological order
  const sorted = [...esmEntries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Get last 7 days of entries
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last7Days = sorted.filter((entry) => new Date(entry.created_at) >= sevenDaysAgo);

  if (last7Days.length < 5) {
    return {
      trajectory: 'Insufficient Data',
      moodSlope: 0,
      energySlope: 0,
      validDays: last7Days.length,
    };
  }

  // Calculate linear regression slopes
  const moodSlope = calculateSlope(last7Days.map((e) => e.mood));
  const energySlope = calculateSlope(last7Days.map((e) => e.energy));

  // Determine trajectory based on slopes
  let trajectory = 'Stable';

  // At-Risk: mood declining significantly AND relatively high scores
  if (moodSlope <= -1.5) {
    const avgMood = last7Days.reduce((sum, e) => sum + e.mood, 0) / last7Days.length;
    if (avgMood >= 5) {
      trajectory = 'At-Risk';
    }
  }

  // Deteriorating: either mood or energy trending downward
  if (trajectory === 'Stable' && (moodSlope < 0 || energySlope < 0)) {
    trajectory = 'Deteriorating';
  }

  return {
    trajectory,
    moodSlope: Number(moodSlope.toFixed(2)),
    energySlope: Number(energySlope.toFixed(2)),
    validDays: last7Days.length,
  };
}

function calculateSlope(values) {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = values.reduce((sum, _y, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}
