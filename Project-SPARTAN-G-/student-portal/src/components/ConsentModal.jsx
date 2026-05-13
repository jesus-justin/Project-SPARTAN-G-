export default function ConsentModal({ open, onAccept, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
    >
      <div style={{ width: 'min(560px, 94vw)', background: '#fff', borderRadius: 12, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Consent Required</h3>
        <p>
          By continuing, you agree that your wellbeing check-ins and assessments will be processed by
          SPARTAN-G for student support services.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onAccept} style={{ background: '#CC0000', color: '#fff', border: 0, padding: '8px 14px', borderRadius: 8 }}>
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}
