import { useEffect, useState } from 'react';
import { getEmergencyContacts, createEmergencyContact, deleteEmergencyContact } from '../api/ogc.api';

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'counseling',
    phone: '',
    email: '',
    available24_7: false,
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const contactTypes = [
    { value: 'security', label: 'Campus Security' },
    { value: 'medical', label: 'Medical' },
    { value: 'counseling', label: 'Counseling' },
    { value: 'admin', label: 'Administration' },
    { value: 'hotline', label: 'Hotline' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await getEmergencyContacts();
      if (res?.data) {
        setContacts(res.data);
      }
    } catch (err) {
      setError('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    try {
      await createEmergencyContact(formData);
      setFormData({ name: '', type: 'counseling', phone: '', email: '', available24_7: false });
      setShowForm(false);
      setSuccessMsg('Contact created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadContacts();
    } catch (err) {
      setError('Failed to create contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await deleteEmergencyContact(contactId);
      setSuccessMsg('Contact deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadContacts();
    } catch (err) {
      setError('Failed to delete contact');
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Emergency Contacts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 12, background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Add New Emergency Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Contact Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                placeholder="e.g., Campus Security"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              >
                {contactTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                placeholder="Email address"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={formData.available24_7}
                onChange={(e) => setFormData({ ...formData, available24_7: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              <label style={{ margin: 0, fontWeight: 600 }}>Available 24/7</label>
            </div>
          </div>
          <button
            onClick={handleCreateContact}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Add Contact
          </button>
        </div>
      )}

      {contacts.length === 0 ? (
        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>
          No emergency contacts configured yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {contacts.map((contact) => (
            <div key={contact.contactId || contact.id} style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#d32f2f' }}>{contact.name}</h3>
                {contact.available24_7 && (
                  <span style={{ padding: '4px 8px', background: '#ff9800', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    24/7
                  </span>
                )}
              </div>
              <p style={{ margin: '8px 0', fontSize: 14 }}>
                <strong>Type:</strong> {contact.type}
              </p>
              <p style={{ margin: '8px 0', fontSize: 14 }}>
                <strong>Phone:</strong> <a href={`tel:${contact.phone}`} style={{ color: '#d32f2f' }}>{contact.phone}</a>
              </p>
              {contact.email && (
                <p style={{ margin: '8px 0', fontSize: 14 }}>
                  <strong>Email:</strong> <a href={`mailto:${contact.email}`} style={{ color: '#d32f2f' }}>{contact.email}</a>
                </p>
              )}
              <button
                onClick={() => handleDeleteContact(contact.contactId || contact.id)}
                style={{
                  marginTop: 12,
                  padding: '6px 12px',
                  background: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
