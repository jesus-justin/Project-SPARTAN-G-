import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acknowledgeNotification, getNotifications, getPopulationDashboard } from '../api/ogc.api';
import NotificationCard from '../components/NotificationCard';
import UnreadBadge from '../components/UnreadBadge';
import PopulationDashboard from '../components/PopulationDashboard';
import { useFacilitatorAuth } from '../context/FacilitatorAuthContext';

const FALLBACK_NOTIFICATIONS = [
  { notif_id: 'fallback-1', caseId: 'CASE-2026-001', riskLevel: 'Moderate', assessmentType: 'PHQ-9 (Depression)', score: 12, timeAgo: '2 hours ago', acknowledged: false, isAnonymized: true },
  { notif_id: 'fallback-2', caseId: 'CASE-2026-002', riskLevel: 'High', assessmentType: 'GAD-7 (Anxiety)', score: 16, timeAgo: '4 hours ago', acknowledged: false, isAnonymized: true },
  {
    notif_id: 'fallback-3',
    caseId: 'CASE-2026-003',
    riskLevel: 'Crisis',
    acknowledged: false,
    assessmentType: 'DASS-21 (Stress)',
    score: 26,
    timeAgo: '1 day ago',
    isAnonymized: true,
  },
];

export default function OgcDashboardPage() {
  const { logout, token } = useFacilitatorAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [populationData, setPopulationData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const normalizeNotification = (item) => ({
    ...item,
    notif_id: item.notif_id ?? item.id ?? null,
    caseId: item.caseId ?? `CASE-UNKNOWN`,
    riskLevel: item.riskLevel ?? item.risk_level ?? 'Low',
    assessmentType: item.assessmentType ?? item.assessment_type ?? 'Assessment Summary',
    score: Number(item.score ?? 0),
    timeAgo: item.timeAgo ?? item.time_ago ?? '',
    isAnonymized: Boolean(item.isAnonymized ?? true),
    acknowledged: Boolean(item.acknowledged ?? item.seen),
    seen: Boolean(item.seen ?? item.acknowledged),
    acknowledgedAt: item.acknowledgedAt ?? item.acknowledged_at ?? null,
  });

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsRefreshing(true);
    }

    try {
      const [notificationsResult, populationResult] = await Promise.allSettled([
        getNotifications(),
        getPopulationDashboard(),
      ]);

      if (notificationsResult.status === 'fulfilled') {
        const nextNotifications = Array.isArray(notificationsResult.value.data)
          ? notificationsResult.value.data.map(normalizeNotification)
          : [];
        setNotifications(nextNotifications);
      } else {
        setNotifications((current) =>
          current.length === 0 ? FALLBACK_NOTIFICATIONS.map(normalizeNotification) : current
        );
      }

      if (populationResult.status === 'fulfilled') {
        setPopulationData(populationResult.value.data || null);
        setSyncError('');
      } else {
        setSyncError('Live reports are temporarily unavailable. Showing the last successful snapshot.');
      }

      setLastSyncedAt(new Date());
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();

    let eventSource = null;
    if (token) {
      const streamUrl = `/api/gabay/stream?access_token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('dashboard-updated', (event) => {
        try {
          const payload = JSON.parse(event.data || '{}');
          setSyncError('');
          loadDashboard({ silent: true });
          if (payload?.source) {
            setLastSyncedAt(new Date());
          }
        } catch {
          loadDashboard({ silent: true });
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        setLastSyncedAt(new Date());
      });

      eventSource.onerror = () => {
        setSyncError('Live stream disconnected. Polling fallback remains active.');
      };
    }

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard({ silent: true });
      }
    };

    const id = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 15000);

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      window.clearInterval(id);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [token]);

  const [populationTab, setPopulationTab] = useState('descriptive');

  const unreadCount = useMemo(
    () => notifications.filter((item) => !(item.acknowledged ?? item.seen)).length,
    [notifications]
  );

  const topShapDrivers = populationData?.topShapDrivers || [];

  const onAcknowledge = async (notificationId) => {
    try {
      await acknowledgeNotification(notificationId);
    } catch {
      // Keep UI responsive even if API endpoint is not yet available.
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.caseId === notificationId || item.notif_id === notificationId
          ? { ...item, acknowledged: true, seen: true, acknowledgedAt: new Date().toISOString() }
          : item
      )
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: '#CC0000' }}>OGC Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ color: '#666', fontSize: 13 }}>
            {lastSyncedAt ? `Last sync: ${lastSyncedAt.toLocaleTimeString()}` : 'Live sync enabled'}
          </span>
          <button onClick={() => loadDashboard()} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
          <button onClick={() => navigate('/analytics')} style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
            📊 Analytics
          </button>
          <button onClick={() => navigate('/case-mapping')} style={{ padding: '8px 16px', background: '#6a1b9a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
            🔎 Case Mapping
          </button>
          <UnreadBadge count={unreadCount} />
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {syncError && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: '#fff4e5', border: '1px solid #ffd59a', color: '#8a5a00' }}>
          {syncError}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #ddd', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'notifications' ? '3px solid #d32f2f' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'notifications' ? 600 : 400,
            color: activeTab === 'notifications' ? '#d32f2f' : '#666',
          }}
        >
          Notifications ({unreadCount})
        </button>
        <button
          onClick={() => setActiveTab('population')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'population' ? '3px solid #d32f2f' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'population' ? 600 : 400,
            color: activeTab === 'population' ? '#d32f2f' : '#666',
          }}
        >
          Population Overview
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          {notifications.length === 0 ? (
            <p style={{ color: '#999' }}>No notifications</p>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.notif_id || notification.caseId}
                notification={notification}
                onAcknowledge={onAcknowledge}
              />
            ))
          )}
        </div>
      )}

      {/* Population Overview Tab */}
      {activeTab === 'population' && (
        <div>
          {populationData && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, #fff, #fff5f5)', border: '1px solid #f1d4d4' }}>
              <div style={{ color: '#666', fontSize: 13, fontWeight: 600 }}>Total students monitored</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#d32f2f' }}>{populationData.totalStudentsMonitored ?? 0}</div>
            </div>
          )}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => setPopulationTab('descriptive')} style={{ padding: '8px 12px', background: populationTab === 'descriptive' ? '#d32f2f' : '#eee', color: populationTab === 'descriptive' ? '#fff' : '#333', border: 'none', borderRadius: 6 }}>Descriptive</button>
            <button onClick={() => setPopulationTab('predictive')} style={{ padding: '8px 12px', background: populationTab === 'predictive' ? '#d32f2f' : '#eee', color: populationTab === 'predictive' ? '#fff' : '#333', border: 'none', borderRadius: 6 }}>Predictive</button>
            <button onClick={() => setPopulationTab('prescriptive')} style={{ padding: '8px 12px', background: populationTab === 'prescriptive' ? '#d32f2f' : '#eee', color: populationTab === 'prescriptive' ? '#fff' : '#333', border: 'none', borderRadius: 6 }}>Prescriptive</button>
          </div>

          {populationTab === 'descriptive' && (
            populationData ? (
              <PopulationDashboard data={populationData} />
            ) : (
              <p style={{ color: '#999' }}>Loading population data...</p>
            )
          )}

          {populationTab === 'predictive' && (
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #ddd' }}>
              <h3 style={{ marginTop: 0 }}>Top SHAP Drivers</h3>
              {topShapDrivers.length === 0 ? (
                <p style={{ color: '#777' }}>No SHAP driver data available yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {topShapDrivers.map((driver) => (
                    <div key={driver.feature} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{driver.feature}</div>
                        <div style={{ color: '#666', fontSize: 13 }}>{driver.avgImpact || 'LOW'} impact</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{driver.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {populationTab === 'prescriptive' && (
            <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #ddd' }}>
              <h3 style={{ marginTop: 0 }}>Intervention Recommendations</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Crisis</div>
                  <div style={{ color: '#666' }}>Immediate intervention required. Reveal identity and contact student.</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>High</div>
                  <div style={{ color: '#666' }}>Schedule appointment within 24 hours. Recommend DASS-21 repeat in 3 days.</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Moderate</div>
                  <div style={{ color: '#666' }}>Monitor for 7 days. Send wellness resources automatically.</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Low</div>
                  <div style={{ color: '#666' }}>Continue monitoring. No action required.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
