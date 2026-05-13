const DASS21_MAP = {
  depression: [3, 5, 10, 13, 16, 17, 21],
  anxiety: [2, 4, 7, 9, 15, 19, 20],
  stress: [1, 6, 8, 11, 12, 14, 18],
};

function sumIndexed(values, indexes) {
  return indexes.reduce((sum, index) => sum + Number(values[index - 1] ?? 0), 0);
}

function classifySubscale(type, score) {
  const thresholds = {
    depression: [9, 13, 20, 27],
    anxiety: [7, 9, 14, 19],
    stress: [14, 18, 25, 33],
  };

  const [normalMax, mildMax, moderateMax, severeMax] = thresholds[type];

  if (score <= normalMax) return 'Normal';
  if (score <= mildMax) return 'Mild';
  if (score <= moderateMax) return 'Moderate';
  if (score <= severeMax) return 'Severe';
  return 'Extremely Severe';
}

export function scoreDASS21(answers) {
  if (!Array.isArray(answers) || answers.length !== 21) {
    throw new Error('DASS-21 answers must be an array of 21 values');
  }

  for (const value of answers) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0 || num > 3) {
      throw new Error('Each DASS-21 answer must be an integer from 0 to 3');
    }
  }

  const depressionRaw = sumIndexed(answers, DASS21_MAP.depression);
  const anxietyRaw = sumIndexed(answers, DASS21_MAP.anxiety);
  const stressRaw = sumIndexed(answers, DASS21_MAP.stress);

  const depression = depressionRaw * 2;
  const anxiety = anxietyRaw * 2;
  const stress = stressRaw * 2;

  return {
    depression,
    anxiety,
    stress,
    depressionSeverity: classifySubscale('depression', depression),
    anxietySeverity: classifySubscale('anxiety', anxiety),
    stressSeverity: classifySubscale('stress', stress),
    totalScore: depression + anxiety + stress,
  };
}
