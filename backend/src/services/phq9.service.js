export const PHQ9_QUESTIONS = [
  {
    id: 1,
    text: 'Little interest or pleasure in doing things',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 2,
    text: 'Feeling down, depressed, or hopeless',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 3,
    text: 'Trouble falling or staying asleep, or sleeping too much',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 4,
    text: 'Feeling tired or having little energy',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 5,
    text: 'Poor appetite or overeating',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 6,
    text: 'Feeling bad about yourself, or that you are a failure, or have let yourself or your family down',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 7,
    text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 8,
    text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite, being so fidgety or restless that you have been moving around a lot more than usual',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 9,
    text: 'Thoughts that you would be better off dead, or of hurting yourself in some way',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
];

export function scorePhq9(answers) {
  if (!Array.isArray(answers) || answers.length !== 9) {
    throw new Error('PHQ-9 answers must be an array of 9 values');
  }

  for (const value of answers) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0 || num > 3) {
      throw new Error('Each PHQ-9 answer must be an integer from 0 to 3');
    }
  }

  const totalScore = answers.reduce((sum, val) => sum + Number(val), 0);

  let severity;
  if (totalScore <= 4) {
    severity = 'None';
  } else if (totalScore <= 9) {
    severity = 'Mild';
  } else if (totalScore <= 14) {
    severity = 'Moderate';
  } else if (totalScore <= 19) {
    severity = 'Moderately Severe';
  } else {
    severity = 'Severe';
  }

  return {
    totalScore,
    severity,
  };
}
