import { Link } from 'react-router-dom';

const RISK_COLORS = {
  Low: '#4CAF50',
  Moderate: '#FFC107',
  High: '#FF5722',
  Crisis: '#D32F2F',
};

export default function NotificationCard({ notification, onAcknowledge }) {
  const color = RISK_COLORS[notification.riskLevel] || RISK_COLORS.Low;
  const isCrisis = notification.riskLevel === 'Crisis';
  const displayId = notification.caseId || `CASE-UNKNOWN`;
  const isSeen = Boolean(notification.seen ?? notification.acknowledged);

  return (
    <article
      style={{
        borderLeft: `6px solid ${color}`,
        border: '1px solid #ececec',
        borderRadius: 12,
        padding: 14,
        background: '#fff',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Case #{displayId}</strong>
        <span style={{ color, fontWeight: 700 }}>{notification.riskLevel}</span>
      </div>

      <p style={{ margin: '10px 0 8px 0', fontWeight: 600 }}>{notification.assessmentType}</p>
      <p style={{ margin: '0 0 8px 0' }}>Score: {notification.score ?? 'N/A'}</p>
      <p style={{ margin: '0 0 12px 0', color: '#666' }}>{notification.timeAgo}</p>

      <div style={{ display: 'flex', gap: 10 }}>
        {isCrisis ? (
          <Link to={`/students/${displayId}`} state={{ notification }}>
            View Details
          </Link>
        ) : (
          <span style={{ color: '#777' }}>View Details available only for Crisis cases</span>
        )}
        {isSeen && (
          <span style={{ color: '#2e7d32', fontWeight: 600 }}>Seen</span>
        )}
        {!isSeen && (
          <button onClick={() => onAcknowledge(notification.caseId)}>Acknowledge</button>
        )}
      </div>
    </article>
  );
}
