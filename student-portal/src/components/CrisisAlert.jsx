export default function CrisisAlert() {
  return (
    <div
      style={{
        border: '1px solid #D32F2F',
        borderLeft: '6px solid #D32F2F',
        borderRadius: 12,
        padding: 16,
        background: '#fff5f5',
      }}
    >
      <h3 style={{ margin: 0, color: '#D32F2F' }}>Crisis Support Needed</h3>
      <p style={{ marginTop: 8 }}>Please contact professional support immediately:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>NCMH: 1553</li>
        <li>Hopeline: +63 917 558 4673</li>
      </ul>
    </div>
  );
}
