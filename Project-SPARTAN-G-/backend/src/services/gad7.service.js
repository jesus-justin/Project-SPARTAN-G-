export const GAD7_QUESTIONS = [
  {
    id: 1,
    text: 'Feeling nervous, anxious, or on edge',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 2,
    text: 'Not being able to stop or control worrying',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 3,
    text: 'Worrying too much about different things',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 4,
    text: 'Trouble relaxing',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 5,
    text: 'Being so restless that it is hard to sit still',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 6,
    text: 'Becoming easily annoyed or irritable',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 7,
    text: 'Feeling afraid, as if something awful might happen',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
];

export function scoreGad7(answers) {
  if (!Array.isArray(answers) || answers.length !== 7) {
    throw new Error('GAD-7 answers must be an array of 7 values');
  }

  for (const value of answers) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0 || num > 3) {
      throw new Error('Each GAD-7 answer must be an integer from 0 to 3');
    }
  }

  const totalScore = answers.reduce((sum, val) => sum + Number(val), 0);

  let severity;
  if (totalScore <= 4) {
    severity = 'Minimal';
  } else if (totalScore <= 9) {
    severity = 'Mild';
  } else if (totalScore <= 14) {
    severity = 'Moderate';
  } else {
    severity = 'Severe';
  }

  return {
    totalScore,
    severity,
  };
}
