import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsentModal from '../components/ConsentModal';
import client from '../api/client';

export default function ConsentPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [loading, setLoading] = useState(false);

  const acceptConsent = async () => {
    setLoading(true);
    try {
      await client.post('/student/consent', { accepted: true });
      localStorage.setItem('consent_given', 'true');
      setShowModal(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Consent POST failed', err);
      // fallback to local-only behaviour
      localStorage.setItem('consent_given', 'true');
      setShowModal(false);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 20 }}>
      <h2>Informed Consent</h2>
      <p>
        SPARTAN-G collects your self-reported wellbeing data to support timely interventions and
        counseling services. You may withdraw your consent by contacting OGC.
      </p>
      <button onClick={() => setShowModal(true)} style={{ background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: '10px 14px' }}>
        Review Consent
      </button>
      <ConsentModal open={showModal} onAccept={acceptConsent} onClose={() => setShowModal(false)} loading={loading} />
    </div>
  );
}
