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
