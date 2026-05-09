import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OverviewChart({ data = {}, description = '' }) {
  const dep = data?.dass21?.depression?.scaled || 0;
  const anx = data?.dass21?.anxiety?.scaled || 0;
  const str = data?.dass21?.stress?.scaled || 0;
  const phq = data?.phq9?.totalScore || 0;
  const gad = data?.gad7?.totalScore || 0;

  const values = [
    { name: 'Depression', value: Math.round((dep / 42) * 100) },
    { name: 'Anxiety', value: Math.round((anx / 42) * 100) },
    { name: 'Stress', value: Math.round((str / 42) * 100) },
    { name: 'PHQ-9', value: Math.round((phq / 27) * 100) },
    { name: 'GAD-7', value: Math.round((gad / 21) * 100) },
  ];

  const hasData = values.some((v) => v.value > 0);

  if (!hasData) {
    return (
      <div style={{ padding: 24, background: '#fff', borderRadius: 10 }}>
        <div style={{ textAlign: 'center', color: '#777' }}>No assessments completed yet</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={values}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="value" fill="#d32f2f" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 12, padding: 12, background: '#f6f6f6', borderRadius: 8 }}>
        <small style={{ color: '#333' }}>{description}</small>
      </div>
    </div>
  );
}
