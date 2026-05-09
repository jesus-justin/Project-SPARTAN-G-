import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

export default function MoodEnergyChart({ entries = [] }) {
  const data = [...entries].slice(-7).map((item) => {
    const date = item.date ? new Date(item.date) : null;
    const label = date ? date.toLocaleDateString(undefined, { weekday: 'short' }) : (item.date || '');
    return {
      label,
      mood: item.mood,
      energy: item.energy,
    };
  });

  const moodAvg = data.length ? (data.reduce((s, d) => s + (d.mood || 0), 0) / data.length) : null;

  if (!data.length) {
    return (
      <div style={{ width: '100%', height: 160, background: '#fff', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#777' }}>No check-in data yet. Complete your daily check-ins.</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 320, background: '#fff', borderRadius: 12, padding: 8 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0, 10]} allowDecimals={false} />
          <Tooltip />
          <Legend />
          {moodAvg !== null && <ReferenceLine y={moodAvg} stroke="#8884d8" strokeDasharray="4 4" label={`7d avg ${moodAvg.toFixed(1)}`} />}
          <Line type="monotone" dataKey="mood" stroke="#CC0000" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="energy" stroke="#1565C0" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
