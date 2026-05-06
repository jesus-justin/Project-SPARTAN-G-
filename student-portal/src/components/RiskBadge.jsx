const COLORS = {
  Low: '#4CAF50',
  Moderate: '#FFC107',
  High: '#FF5722',
  Crisis: '#D32F2F',
};

export default function RiskBadge({ level = 'Low' }) {
  const color = COLORS[level] || COLORS.Low;

  return (
    <span
      style={{
        background: color,
        color: '#fff',
        borderRadius: 999,
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {level}
    </span>
  );
}
