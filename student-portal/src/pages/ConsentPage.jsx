import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsentModal from '../components/ConsentModal';

export default function ConsentPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);

  const acceptConsent = () => {
    localStorage.setItem('consent_given', 'true');
    setShowModal(false);
    navigate('/dashboard');
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
      <ConsentModal open={showModal} onAccept={acceptConsent} onClose={() => setShowModal(false)} />
    </div>
  );
}
