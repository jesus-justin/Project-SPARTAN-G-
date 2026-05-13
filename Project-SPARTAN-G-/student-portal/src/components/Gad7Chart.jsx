import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Gad7Chart({ history = [], description = '' }) {
  const data = history.map((h) => ({
    date: h.date ? new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : h.date,
    score: h.totalScore || 0,
    severity: h.severity || '',
  }));

  if (!data.length) {
    return (
      <div style={{ padding: 24, background: '#fff', borderRadius: 10 }}>
        <div style={{ textAlign: 'center', color: '#777' }}>No GAD-7 data yet</div>
      </div>
    );
  }

  const latest = data[data.length - 1];

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
      <div style={{ height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="date" />
            <YAxis domain={[0, 21]} />
            <Tooltip />
            <Bar dataKey="score" fill="#6A1B9A" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <strong>{latest.score} / 21</strong>
          <div style={{ color: '#666' }}>{latest.severity}</div>
        </div>
        <div style={{ flex: 2, padding: 12, background: '#f6f6f6', borderRadius: 8 }}>
          <small>{description}</small>
        </div>
      </div>
    </div>
  );
}
