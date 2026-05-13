import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function Dass21Chart({ history = [], description = '' }) {
  const data = history.map((h) => ({
    date: h.date ? new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : h.date,
    depression: h.depression?.scaled || 0,
    anxiety: h.anxiety?.scaled || 0,
    stress: h.stress?.scaled || 0,
  }));

  if (!data.length) {
    return (
      <div style={{ padding: 24, background: '#fff', borderRadius: 10 }}>
        <div style={{ textAlign: 'center', color: '#777' }}>No DASS-21 data yet</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="depression" stroke="#d32f2f" />
            <Line type="monotone" dataKey="anxiety" stroke="#ff9800" />
            <Line type="monotone" dataKey="stress" stroke="#0288D1" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 12, padding: 12, background: '#f6f6f6', borderRadius: 8 }}>
        <small style={{ color: '#333' }}>{description}</small>
      </div>
    </div>
  );
}
