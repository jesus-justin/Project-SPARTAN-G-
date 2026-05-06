export function evaluateCssrs(payload) {
  const answers = {
    item1: Boolean(payload.item1),
    item2: Boolean(payload.item2),
    item3: Boolean(payload.item3),
    item4: Boolean(payload.item4),
    item5: Boolean(payload.item5),
  };

  if (answers.item3) {
    return {
      riskLevel: 'Crisis',
      rationale: 'C-SSRS item3 is true, immediate crisis risk.',
      answers,
    };
  }

  if (answers.item5 || answers.item4) {
    return {
      riskLevel: 'High',
      rationale: 'Presence of suicidal behavior indicators.',
      answers,
    };
  }

  if (answers.item1 || answers.item2) {
    return {
      riskLevel: 'Moderate',
      rationale: 'Passive or active ideation present without item3 trigger.',
      answers,
    };
  }

  return {
    riskLevel: 'Low',
    rationale: 'No concerning indicators in current C-SSRS answers.',
    answers,
  };
}
