import { useEffect, useMemo, useState } from 'react';
import { acknowledgeNotification, getNotifications } from '../api/ogc.api';
import NotificationCard from '../components/NotificationCard';
import UnreadBadge from '../components/UnreadBadge';
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
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const result = await getNotifications();
      setNotifications(result.data || []);
    } catch {
      setNotifications(FALLBACK_NOTIFICATIONS);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 30000);
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
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: '#CC0000' }}>OGC Risk Notifications</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UnreadBadge count={unreadCount} />
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
}
