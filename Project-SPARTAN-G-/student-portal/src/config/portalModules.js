export const studentModules = {
  gawa: {
    label: 'GAWA',
    title: 'Assessments',
    description: 'Complete screening tools and review your wellness status.',
    pages: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/dass21', label: 'DASS-21' },
      { path: '/phq9', label: 'PHQ-9' },
      { path: '/gad7', label: 'GAD-7' },
      { path: '/esm', label: 'ESM Check-in' },
    ],
  },
  ginhawa: {
    label: 'GINHAWA',
    title: 'Wellness Resources',
    description: 'Explore coping tools and safety planning support.',
    pages: [
      { path: '/ginhawa', label: 'Wellness Resources' },
      { path: '/safety-plan', label: 'Safety Plan' },
    ],
  },
};

export const moduleOrder = ['gawa', 'ginhawa'];

export function getPrimaryPageForModule(moduleKey) {
  return studentModules[moduleKey]?.pages?.[0]?.path || '/dashboard';
}
