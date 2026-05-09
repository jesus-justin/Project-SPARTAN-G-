import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import MoodEnergyChart from '../components/MoodEnergyChart';
import RiskBadge from '../components/RiskBadge';
import CrisisAlert from '../components/CrisisAlert';
import OverviewChart from '../components/OverviewChart';
import Dass21Chart from '../components/Dass21Chart';
import Phq9Chart from '../components/Phq9Chart';
import Gad7Chart from '../components/Gad7Chart';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [esmEntries, setEsmEntries] = useState([]);
  const [latestScores, setLatestScores] = useState(null);
  const [dassHistory, setDassHistory] = useState([]);
  const [phqHistory, setPhqHistory] = useState([]);
  const [gadHistory, setGadHistory] = useState([]);
  const [overviewDesc, setOverviewDesc] = useState('');
  const [dassDesc, setDassDesc] = useState('');
  const [phqDesc, setPhqDesc] = useState('');
  const [gadDesc, setGadDesc] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Unknown');
  const [trajectory, setTrajectory] = useState('Unknown');
  const [displayName, setDisplayName] = useState('Student');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [dashboardRes, trajectoryRes] = await Promise.allSettled([
          client.get('/student/dashboard'),
          client.get('/student/trajectory'),
        ]);

        if (dashboardRes.status === 'fulfilled') {
          const data = dashboardRes.value.data?.data || {};
          const student = data.student || {};
          setDisplayName(normalizeDisplayName(student.name || buildUserName(user)));
          setRiskLevel(data.currentRisk || 'Unknown');
          setEsmEntries((data.esmData && data.esmData.last7Days) ? data.esmData.last7Days : []);
          setLatestScores(data.latestScores || null);
          setDassHistory(Array.isArray(data.dass21History) ? data.dass21History : []);
          setPhqHistory(Array.isArray(data.phq9History) ? data.phq9History : []);
          setGadHistory(Array.isArray(data.gad7History) ? data.gad7History : []);
          setOverviewDesc((data.generalSummary && data.generalSummary.description) ? data.generalSummary.description : '');
          setDassDesc(data.dassDescription || '');
          setPhqDesc(data.phqDescription || '');
          setGadDesc(data.gadDescription || '');
        } else {
          setDisplayName(normalizeDisplayName(buildUserName(user)));
        }

        if (trajectoryRes.status === 'fulfilled') {
          const data = trajectoryRes.value.data?.data || {};
          setTrajectory(data.trajectory || 'Unknown');
        }
      } catch {
        setEsmEntries([]);
        setDisplayName(normalizeDisplayName(buildUserName(user)));
      }
    }

    load();
  }, [user]);

  const latest = useMemo(() => (esmEntries.length ? esmEntries[0] : null), [esmEntries]);

  const showUnknownRiskMessage = !riskLevel || riskLevel === 'Unknown';

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
      <h2 style={{ marginBottom: 8 }}>Welcome, {displayName}</h2>
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

      {showUnknownRiskMessage && (
        <p style={{ marginTop: -4, marginBottom: 12, color: '#757575', fontStyle: 'italic' }}>
          Complete your assessments to see your risk level
        </p>
      )}

      {riskLevel === 'Crisis' && <CrisisAlert />}

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          {['Overview', 'DASS-21', 'PHQ-9', 'GAD-7', 'Daily Check-in'].map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: activeTab === i ? '2px solid #d32f2f' : '1px solid #eee',
                background: activeTab === i ? '#ffecec' : '#fff',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 0 && (
            <div>
              {/* Overview chart */}
              <div style={{ marginBottom: 12 }}>
                {/* Lazy: reuse small bar chart inline */}
                <OverviewChart data={latestScores || {}} description={overviewDesc} />
              </div>
            </div>
          )}
          {activeTab === 1 && <Dass21Chart history={dassHistory} description={dassDesc} />}
          {activeTab === 2 && <Phq9Chart history={phqHistory} description={phqDesc} />}
          {activeTab === 3 && <Gad7Chart history={gadHistory} description={gadDesc} />}
          {activeTab === 4 && (
            <div>
              <h4 style={{ marginTop: 0 }}>Last 7 ESM Entries</h4>
              <MoodEnergyChart entries={esmEntries} />
            </div>
          )}
        </div>
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
            background: '#1565C0',
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
            background: '#6A1B9A',
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

function buildUserName(user) {
  if (!user) {
    return 'Student';
  }

  const direct = user.name || user.fullName || user.full_name;
  if (typeof direct === 'string' && direct.trim()) {
    return direct;
  }

  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const combined = `${firstName} ${lastName}`.trim();
  return combined || 'Student';
}

function normalizeDisplayName(value) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return 'Student';
  }

  const parts = normalized.split(' ');
  if (parts.length % 2 === 0) {
    const half = parts.length / 2;
    const firstHalf = parts.slice(0, half);
    const secondHalf = parts.slice(half);
    if (firstHalf.join(' ').toLowerCase() === secondHalf.join(' ').toLowerCase()) {
      return firstHalf.join(' ');
    }
  }

  return normalized;
}
