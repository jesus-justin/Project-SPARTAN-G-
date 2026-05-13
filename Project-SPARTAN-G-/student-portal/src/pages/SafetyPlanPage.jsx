import { useEffect, useState } from 'react';
import { getSafetyPlan, saveSafetyPlan } from '../api/ginhawa.api';

export default function SafetyPlanPage() {
  const [plan, setPlan] = useState({
    warningSigns: '',
    copingStrategies: '',
    socialSupports: '',
    professionalContacts: '',
    safeEnvironment: '',
    reasonsToLive: '',
    emergencyContacts: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getSafetyPlan();
        if (res?.data) {
          setPlan({
            warningSigns: res.data.warningSigns || '',
            copingStrategies: res.data.copingStrategies || '',
            socialSupports: res.data.socialSupports || '',
            professionalContacts: res.data.professionalContacts || '',
            safeEnvironment: res.data.safeEnvironment || '',
            reasonsToLive: res.data.reasonsToLive || '',
            emergencyContacts: res.data.emergencyContacts || '',
          });
        }
      } catch (err) {
        setError('Failed to load safety plan');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleChange = (field, value) => {
    setPlan((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      await saveSafetyPlan(plan);
      setSuccessMsg('Safety plan saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to save safety plan: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 20 }}>My Safety Plan</h2>

      {error && (
        <div style={{ padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 12, background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {[
          { key: 'warningSigns', label: 'Warning Signs', hint: 'What are your personal warning signs that a crisis might be developing?' },
          { key: 'copingStrategies', label: 'Coping Strategies', hint: 'What internal coping strategies can you use?' },
          { key: 'socialSupports', label: 'Social Supports', hint: 'Who are people you can ask for help?' },
          { key: 'professionalContacts', label: 'Professional Contacts', hint: 'Mental health professionals or agencies you can contact' },
          { key: 'safeEnvironment', label: 'Safe Environment', hint: 'How can you make your environment safer?' },
          { key: 'reasonsToLive', label: 'Reasons to Live', hint: 'What reasons do you have for living?' },
          { key: 'emergencyContacts', label: 'Emergency Contacts', hint: 'Emergency services to call in crisis' },
        ].map(({ key, label, hint }) => (
          <div key={key}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
              {label}
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#999' }}>{hint}</p>
            <textarea
              value={plan[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={hint}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
                fontFamily: 'inherit',
                minHeight: 100,
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 600,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Safety Plan'}
        </button>
      </div>
    </div>
  );
}
