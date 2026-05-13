import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFacilitatorAuth } from '../context/FacilitatorAuthContext';

export default function CaseMappingPage() {
  const { token } = useFacilitatorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [caseId, setCaseId] = useState(location?.state?.caseId || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setError('');
    setResult(null);
    if (!caseId) return setError('Please enter a Case ID (e.g. CASE-2026-001)');
    setLoading(true);
    try {
      const resp = await fetch(`/api/gabay/case-mapping/${encodeURIComponent(caseId)}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await resp.json();
      if (!resp.ok) {
        setError(body?.message || 'Lookup failed');
      } else {
        setResult(body.data || null);
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: 16 }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: 12 }}>← Back to dashboard</button>
      <h2>Case Mapping (SR-code Lookup)</h2>
      <p style={{ color: '#666' }}>Lookup the student SR-code corresponding to a pseudonymized Case ID. SR-code is revealed only for Crisis cases.</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="CASE-2026-001" style={{ flex: 1, padding: 8 }} />
        <button onClick={lookup} disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Looking up...' : 'Lookup'}</button>
      </div>

      {error && <div style={{ marginTop: 12, color: '#a94442' }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #ddd' }}>
          <div><strong>Case ID:</strong> {result.caseId}</div>
          <div style={{ marginTop: 8 }}><strong>SR-code:</strong> {result.srCode}</div>
        </div>
      )}
    </div>
  );
}
