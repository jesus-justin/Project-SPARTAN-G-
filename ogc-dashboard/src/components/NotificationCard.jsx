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
  const displayId = notification.caseId || notification.studentId || `#${notification.id}`;
  const isSeen = Boolean(notification.seen ?? notification.acknowledged);
  const studentLabel = notification.studentName || (notification.studentId ? `Student ${notification.studentId}` : 'Student record');

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
        <strong>Case {displayId}</strong>
        <span style={{ color }}>{notification.riskLevel}</span>
      </div>

      {!isCrisis && (
        <p style={{ marginBottom: 10 }}>
          Student details hidden. Open only when required for intervention.
        </p>
      )}

      {isCrisis && (
        <p style={{ marginBottom: 10 }}>
          {studentLabel} {notification.studentId ? `(${notification.studentId})` : ''}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Link to={`/students/${displayId}`} state={{ notification }}>
          View details
        </Link>
        {isSeen && (
          <span style={{ color: '#2e7d32', fontWeight: 600 }}>Seen</span>
        )}
        {!isSeen && (
          <button onClick={() => onAcknowledge(notification.id)}>Acknowledge</button>
        )}
      </div>
    </article>
  );
}
