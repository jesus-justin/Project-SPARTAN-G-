import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestCssrs, getRecentEsm } from '../api/assessment.api';
import MoodEnergyChart from '../components/MoodEnergyChart';
import RiskBadge from '../components/RiskBadge';
import CrisisAlert from '../components/CrisisAlert';

export default function DashboardPage() {
  const [esmEntries, setEsmEntries] = useState([]);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [trajectory, setTrajectory] = useState('Stable');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [esmRes, cssrsRes] = await Promise.allSettled([getRecentEsm(7), getLatestCssrs()]);

        if (esmRes.status === 'fulfilled') {
          setEsmEntries(esmRes.value.data || []);
        }

        if (cssrsRes.status === 'fulfilled') {
          setRiskLevel(cssrsRes.value.data?.risk_level || 'Low');
          setTrajectory(cssrsRes.value.data?.trajectory || 'Stable');
        }
      } catch {
        setEsmEntries([]);
      }
    }

    load();
  }, []);

  const latest = useMemo(() => (esmEntries.length ? esmEntries[0] : null), [esmEntries]);

  const getTrajectoryColor = () => {
    switch (trajectory) {
      case 'Stable':
        return '#4caf50';
      case 'Deteriorating':
        return '#ff9800';
      case 'At-Risk':
        return '#f44336';
      case 'Insufficient Data':
        return '#9e9e9e';
      default:
        return '#2196f3';
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Wellbeing Dashboard</h2>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <span>Current Risk:</span>
        <RiskBadge level={riskLevel} />
        <span
          style={{
            padding: '4px 12px',
            background: getTrajectoryColor(),
            color: '#fff',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {trajectory}
        </span>
      </div>

      {riskLevel === 'Crisis' && <CrisisAlert />}

      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Last 7 ESM Entries</h3>
        <MoodEnergyChart entries={esmEntries} />
      </div>

      {latest && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#fff', border: '1px solid #eee' }}>
          <strong>Most Recent Check-in</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            Mood: {latest.mood} | Energy: {latest.energy} | Stress: {latest.stress}
          </p>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <button
          onClick={() => navigate('/dass21')}
          style={{
            padding: '12px',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Take DASS-21
        </button>
        <button
          onClick={() => navigate('/phq9')}
          style={{
            padding: '12px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Take PHQ-9
        </button>
        <button
          onClick={() => navigate('/gad7')}
          style={{
            padding: '12px',
            background: '#7b1fa2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Take GAD-7
        </button>
        <button
          onClick={() => navigate('/ginhawa')}
          style={{
            padding: '12px',
            background: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Wellness Resources
        </button>
        <button
          onClick={() => navigate('/safety-plan')}
          style={{
            padding: '12px',
            background: '#f57c00',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          My Safety Plan
        </button>
        <button
          onClick={() => navigate('/esm')}
          style={{
            padding: '12px',
            background: '#00796b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Daily Check-in
        </button>
      </div>
    </div>
  );
}
