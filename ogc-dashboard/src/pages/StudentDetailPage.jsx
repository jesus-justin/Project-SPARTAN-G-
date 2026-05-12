import { Link, useLocation, useParams } from 'react-router-dom';
import AccessDenied from '../components/AccessDenied';

export default function StudentDetailPage() {
  const { caseId } = useParams();
  const location = useLocation();
  const notification = location.state?.notification;

  if (notification?.riskLevel !== 'Crisis') {
    return <AccessDenied message="Identity only revealed for Crisis cases" />;
  }

  return (
    <div style={{ maxWidth: 760, margin: '24px auto', padding: 16 }}>
      <Link to="/dashboard">Back to dashboard</Link>
      <h2>Case #{caseId}</h2>
      <p>Risk Level: <strong>{notification?.riskLevel || 'Unknown'}</strong></p>
      <div style={{ border: '1px solid #D32F2F', borderRadius: 10, padding: 12, background: '#fff5f5' }}>
        <p style={{ margin: 0 }}>Student Name: {notification?.studentName || 'Unavailable'}</p>
        <p style={{ margin: '8px 0 0 0' }}>Student ID: {notification?.studentId || 'Unavailable'}</p>
      </div>
    </div>
  );
}
