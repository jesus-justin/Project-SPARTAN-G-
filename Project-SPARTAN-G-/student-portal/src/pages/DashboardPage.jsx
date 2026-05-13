import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import MoodEnergyChart from '../components/MoodEnergyChart';
import RiskBadge from '../components/RiskBadge';
import CrisisAlert from '../components/CrisisAlert';
import OverviewChart from '../components/OverviewChart';
import Dass21Chart from '../components/Dass21Chart';
import Phq9Chart from '../components/Phq9Chart';
import Gad7Chart from '../components/Gad7Chart';
import { useAuth } from '../context/AuthContext';
import { studentModules, moduleOrder, getPrimaryPageForModule } from '../config/portalModules';

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
  const location = useLocation();
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
          // Extract entries array from history objects
          setDassHistory(Array.isArray(data.dass21History?.entries) ? data.dass21History.entries : (Array.isArray(data.dass21History) ? data.dass21History : []));
          setPhqHistory(Array.isArray(data.phq9History?.entries) ? data.phq9History.entries : (Array.isArray(data.phq9History) ? data.phq9History : []));
          setGadHistory(Array.isArray(data.gad7History?.entries) ? data.gad7History.entries : (Array.isArray(data.gad7History) ? data.gad7History : []));
          setOverviewDesc((data.generalSummary && data.generalSummary.description) ? data.generalSummary.description : '');
          setDassDesc(data.dass21History?.description || data.dassDescription || '');
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
  }, [user, location]);

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
    <div className="page-frame">
      <section className="page-hero">
        <div className="card hero-copy">
          <h1>Welcome, {displayName}</h1>
          <p>
            The student portal now groups your work into the same two modules used by the earlier prototype: assessment first, wellness and safety second.
          </p>
          <div className="tab-row" style={{ marginTop: 18 }}>
            {moduleOrder.map((moduleKey) => (
              <button key={moduleKey} type="button" className="tab-button" onClick={() => navigate(getPrimaryPageForModule(moduleKey))}>
                {studentModules[moduleKey].label}
              </button>
            ))}
          </div>
        </div>

        <aside className="hero-panel">
          <div className="status-badge">Current Risk</div>
          <div style={{ marginTop: 10 }}>
            <RiskBadge level={riskLevel} />
          </div>
          <div className="metric-grid">
            <div className="metric">
              <span>Trajectory</span>
              <strong>{trajectory}</strong>
            </div>
            <div className="metric">
              <span>Latest Check-in</span>
              <strong>{latest ? 'Available' : 'None yet'}</strong>
            </div>
          </div>
          {showUnknownRiskMessage && (
            <p style={{ marginTop: 14, marginBottom: 0, color: 'rgba(255,255,255,0.84)' }}>
              Complete your assessments to see your risk level
            </p>
          )}
          {riskLevel === 'Crisis' && <div style={{ marginTop: 14 }}><CrisisAlert /></div>}
        </aside>
      </section>

      <section className="dashboard-layout" style={{ marginTop: 16 }}>
        <aside className="module-stack">
          <div className="module-card active">
            <strong>{studentModules.gawa.label}</strong>
            <p className="muted-text" style={{ marginTop: 8 }}>
              {studentModules.gawa.description}
            </p>
          </div>
          <div className="module-card">
            <strong>{studentModules.ginhawa.label}</strong>
            <p className="muted-text" style={{ marginTop: 8 }}>
              {studentModules.ginhawa.description}
            </p>
          </div>
          <div className="card">
            <strong>Quick Links</strong>
            <div className="button-row" style={{ marginTop: 12 }}>
              <button onClick={() => navigate('/dass21')} className="primary-button" type="button">DASS-21</button>
              <button onClick={() => navigate('/phq9')} className="ghost-button" type="button">PHQ-9</button>
              <button onClick={() => navigate('/gad7')} className="ghost-button" type="button">GAD-7</button>
              <button onClick={() => navigate('/ginhawa')} className="ghost-button" type="button">GINHAWA</button>
              <button onClick={() => navigate('/safety-plan')} className="ghost-button" type="button">Safety Plan</button>
              <button onClick={() => navigate('/esm')} className="ghost-button" type="button">ESM</button>
            </div>
          </div>
        </aside>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <div className="tab-row">
              {['Overview', 'DASS-21', 'PHQ-9', 'GAD-7', 'Daily Check-in'].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`tab-button ${activeTab === i ? 'active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              {activeTab === 0 && <OverviewChart data={latestScores || {}} description={overviewDesc} />}
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
            <div className="card">
              <strong>Most Recent Check-in</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Mood: {latest.mood} | Energy: {latest.energy} | Stress: {latest.stress}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>Next Actions</h3>
        <div className="quick-grid">
          <button onClick={() => navigate('/dass21')} className="primary-button" type="button">Take DASS-21</button>
          <button onClick={() => navigate('/phq9')} className="primary-button" type="button">Take PHQ-9</button>
          <button onClick={() => navigate('/gad7')} className="primary-button" type="button">Take GAD-7</button>
          <button onClick={() => navigate('/ginhawa')} className="primary-button" type="button">Wellness Resources</button>
          <button onClick={() => navigate('/safety-plan')} className="ghost-button" type="button">My Safety Plan</button>
          <button onClick={() => navigate('/esm')} className="ghost-button" type="button">Daily Check-in</button>
        </div>
      </section>
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
