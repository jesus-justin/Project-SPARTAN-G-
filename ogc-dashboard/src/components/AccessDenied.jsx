export default function AccessDenied({ message }) {
  return (
    <div style={{ maxWidth: 680, margin: '48px auto', padding: 20, border: '1px solid #f3c0c0', borderRadius: 12, background: '#fff5f5', color: '#a11d1d' }}>
      <h2 style={{ marginTop: 0 }}>Access Denied</h2>
      <p style={{ marginBottom: 0 }}>{message}</p>
    </div>
  );
}