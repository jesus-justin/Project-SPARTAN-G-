import { useEffect, useMemo, useState } from 'react';
import { getLatestCssrs, getRecentEsm } from '../api/assessment.api';
import MoodEnergyChart from '../components/MoodEnergyChart';
import RiskBadge from '../components/RiskBadge';
import CrisisAlert from '../components/CrisisAlert';

export default function DashboardPage() {
  const [esmEntries, setEsmEntries] = useState([]);
  const [riskLevel, setRiskLevel] = useState('Low');

  useEffect(() => {
    async function load() {
      try {
        const [esmRes, cssrsRes] = await Promise.allSettled([getRecentEsm(7), getLatestCssrs()]);

        if (esmRes.status === 'fulfilled') {
          setEsmEntries(esmRes.value.data || []);
        }

        if (cssrsRes.status === 'fulfilled') {
          setRiskLevel(cssrsRes.value.data?.risk_level || 'Low');
        }
      } catch {
        setEsmEntries([]);
      }
    }

    load();
  }, []);

  const latest = useMemo(() => (esmEntries.length ? esmEntries[0] : null), [esmEntries]);

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Wellbeing Dashboard</h2>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <span>Current Risk:</span>
        <RiskBadge level={riskLevel} />
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
    </div>
  );
}
