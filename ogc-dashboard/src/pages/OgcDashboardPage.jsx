import { useEffect, useMemo, useState } from 'react';
import { acknowledgeNotification, getNotifications, getPopulationDashboard } from '../api/ogc.api';
import NotificationCard from '../components/NotificationCard';
import UnreadBadge from '../components/UnreadBadge';
import PopulationDashboard from '../components/PopulationDashboard';
import { useFacilitatorAuth } from '../context/FacilitatorAuthContext';

const FALLBACK_NOTIFICATIONS = [
  { id: 1, caseId: 'A1023', riskLevel: 'Moderate', acknowledged: false },
  { id: 2, caseId: 'A1024', riskLevel: 'High', acknowledged: false },
  {
    id: 3,
    caseId: 'A1025',
    riskLevel: 'Crisis',
    acknowledged: false,
    studentName: 'Juan Dela Cruz',
    studentId: '2020-00001',
  },
];

export default function OgcDashboardPage() {
  const { logout } = useFacilitatorAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [populationData, setPopulationData] = useState(null);

  const loadNotifications = async () => {
    try {
      const result = await getNotifications();
      setNotifications(result.data || []);
    } catch {
      setNotifications(FALLBACK_NOTIFICATIONS);
    }
  };

  const loadPopulationData = async () => {
    try {
      const result = await getPopulationDashboard();
      setPopulationData(result.data || null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    loadPopulationData();
    const id = setInterval(() => {
      loadNotifications();
      loadPopulationData();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const [populationTab, setPopulationTab] = useState('descriptive');

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.acknowledged).length,
    [notifications]
  );

  const onAcknowledge = async (notificationId) => {
    try {
      await acknowledgeNotification(notificationId);
    } catch {
      // Keep UI responsive even if API endpoint is not yet available.
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, acknowledged: true } : item
      )
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: '#CC0000' }}>OGC Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UnreadBadge count={unreadCount} />
          <button onClick={logout}>Logout</button>
        </div>
      </header>

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
                key={notification.id}
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
              <h3 style={{ marginTop: 0 }}>Top SHAP Drivers (recent notifications)</h3>
              {notifications.length === 0 ? (
                <p style={{ color: '#777' }}>No recent notifications</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {Object.entries(
                    notifications.reduce((acc, n) => {
                      const drivers = n.shapDrivers || [];
                      drivers.forEach((d) => {
                        const key = d.feature;
                        acc[key] = acc[key] || { feature: d.feature, value: 0, impact: d.impact || 'LOW' };
                        acc[key].value += d.value || 0;
                      });
                      return acc;
                    }, {})
                  ).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{v.feature}</div>
                        <div style={{ color: '#666', fontSize: 13 }}>{v.impact || ''}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{Math.round(v.value)}</div>
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
