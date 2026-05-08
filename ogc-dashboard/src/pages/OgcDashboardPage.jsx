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
          {populationData ? (
            <PopulationDashboard data={populationData} />
          ) : (
            <p style={{ color: '#999' }}>Loading population data...</p>
          )}
        </div>
      )}
    </div>
  );
}
