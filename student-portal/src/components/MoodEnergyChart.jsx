import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function MoodEnergyChart({ entries = [] }) {
  const chartData = [...entries].reverse().map((item, idx) => ({
    label: `D${idx + 1}`,
    mood: item.mood,
    energy: item.energy,
    stress: item.stress,
  }));

  return (
    <div style={{ width: '100%', height: 280, background: '#fff', borderRadius: 12, padding: 8 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[1, 5]} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="mood" stroke="#CC0000" strokeWidth={2} />
          <Line type="monotone" dataKey="energy" stroke="#1E88E5" strokeWidth={2} />
          <Line type="monotone" dataKey="stress" stroke="#FF5722" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
