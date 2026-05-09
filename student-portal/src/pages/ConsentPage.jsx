import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function ConsentPage() {
  const navigate = useNavigate();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [crisisAgreed, setCrisisAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canContinue = privacyAgreed && crisisAgreed;

  const acceptConsent = async () => {
    if (!canContinue) {
      return;
    }

    setLoading(true);
    try {
      await client.post('/student/consent', { accepted: true });
      localStorage.setItem('consent_given', 'true');
      navigate('/dashboard');
    } catch (err) {
      console.error('Consent POST failed', err);
      // fallback to local-only behaviour
      localStorage.setItem('consent_given', 'true');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const sectionTitleStyle = {
    color: '#CC0000',
    fontWeight: 700,
    margin: '0 0 10px 0',
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: 10,
    background: '#fff',
    padding: 16,
    marginBottom: 12,
  };

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <div
        style={{
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          paddingRight: 8,
        }}
      >
        <section style={cardStyle}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#CC0000',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              BSU
            </div>
            <div>
              <h2 style={{ ...sectionTitleStyle, marginBottom: 4 }}>Informed Consent & Data Privacy Notice</h2>
              <div style={{ fontWeight: 600 }}>SPARTAN-G Mental Health Support System</div>
              <div style={{ fontSize: 13 }}>
                Batangas State University - The National Engineering University, Lipa Campus
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Introduction</h3>
          <p style={{ margin: 0 }}>
            Batangas State University, The National Engineering University (BatStateU-TNEU) is
            committed to protecting your right to privacy. This consent form explains how
            SPARTAN-G collects, uses, and protects your personal and mental health data in
            compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and the Family
            Educational Rights and Privacy Act (FERPA).
          </p>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Data We Collect</h3>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li>Full name and student ID number</li>
            <li>College, year level, and program</li>
            <li>
              Mental health assessment responses (DASS-21, PHQ-9, GAD-7, C-SSRS, ESM check-ins)
            </li>
            <li>Risk classification results and trajectory data</li>
            <li>Safety plan information (if provided)</li>
            <li>Session timestamps and app usage logs</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>How Your Data Is Used</h3>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li>To assess and monitor your mental health and wellbeing</li>
            <li>To generate risk classifications and referral actions</li>
            <li>To provide personalized wellness resources (GINHAWA)</li>
            <li>
              To notify OGC (Office of Guidance and Counseling) facilitators when intervention is
              needed
            </li>
            <li>To generate anonymized population-level wellness reports</li>
            <li>
              For academic and institutional research purposes only with your separate consent
            </li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>How We Protect Your Data</h3>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li>All data is encrypted in transit using TLS 1.2+</li>
            <li>Mental health records are encrypted at rest (AES-256)</li>
            <li>
              Your identity is anonymized in OGC notifications EXCEPT in Crisis situations requiring
              intervention
            </li>
            <li>Only authorized OGC facilitators can access your data</li>
            <li>Data is stored in a secure institutional database</li>
            <li>Your data will not be sold or shared with third parties</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Your Rights Under the Data Privacy Act of 2012</h3>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li>Right to be informed about data collection</li>
            <li>Right to access your personal data at any time</li>
            <li>Right to correct inaccurate or outdated data</li>
            <li>Right to object to data processing</li>
            <li>Right to erasure of your personal data</li>
            <li>
              Right to file a complaint with the National Privacy Commission (NPC) at
              complaints@privacy.gov.ph
            </li>
          </ul>
        </section>

        <section
          style={{
            ...cardStyle,
            background: '#FFE0B2',
            border: '1px solid #FF9800',
          }}
        >
          <h3 style={sectionTitleStyle}>Important: Crisis Disclosure Policy</h3>
          <p style={{ margin: 0 }}>
            In cases where your assessment indicates a CRISIS risk level, your identity and contact
            information WILL be disclosed to OGC facilitators and university emergency services to
            ensure your safety. This disclosure is permitted under RA 10173 as a legitimate purpose
            to protect vital interests of the data subject.
          </p>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Data Protection Officer</h3>
          <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
            {'For questions about this privacy notice or to exercise your data privacy rights, contact:\n'}
            {'Office of Guidance and Counseling (OGC)\n'}
            {'Batangas State University - TNEU Lipa Campus\n'}
            {'A. Tanco Drive, Brgy. Marawoy, Lipa, Batangas 4217\n'}
            {'Tel: (+63 43) 980-0385 to 94 loc. 3130\n'}
            {'Email: cics.lipa@g.batstate-u.edu.ph'}
          </p>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>Consent Confirmation</h3>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              I have read and understood the Data Privacy Notice above. I give my informed consent
              for SPARTAN-G to collect and process my personal and mental health data for the
              purposes described above.
            </span>
          </label>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={crisisAgreed}
              onChange={(e) => setCrisisAgreed(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              I understand that in a Crisis situation, my identity may be disclosed to OGC
              facilitators and emergency services for my safety.
            </span>
          </label>

          <button
            onClick={acceptConsent}
            disabled={!canContinue || loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: 0,
              borderRadius: 8,
              color: '#fff',
              background: canContinue ? '#CC0000' : '#999',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            {loading ? 'Submitting...' : 'Continue'}
          </button>
        </section>

        <section style={{ ...cardStyle, marginBottom: 0 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            This consent can be withdrawn at any time by contacting the OGC. Withdrawal of consent
            will not affect data already processed.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
            SPARTAN-G v2.0 | BatStateU-TNEU Lipa Campus | In compliance with RA 10173
          </p>
        </section>
      </div>
    </div>
  );
}
