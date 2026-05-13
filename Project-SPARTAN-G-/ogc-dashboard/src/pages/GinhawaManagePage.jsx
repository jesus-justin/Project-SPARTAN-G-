import { useEffect, useState } from 'react';
import { getGinhawaContent, createGinhawaContent, updateGinhawaContent, publishGinhawaContent, archiveGinhawaContent } from '../api/ginhawa.api';

export default function GinhawaManagePage() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    contentType: 'article',
    contentUrl: '',
    description: '',
    category: '',
    riskLevels: [],
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const contentTypes = ['article', 'video', 'brochure', 'exercise'];
  const riskLevelOptions = ['Low', 'Moderate', 'High', 'Crisis'];
  const categories = ['Mental Health', 'Coping Strategies', 'Academic', 'Crisis Resources', 'Wellness', 'General'];

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const res = await getGinhawaContent();
      if (res?.data) {
        setContents(res.data);
      }
    } catch (err) {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = async () => {
    if (!formData.title || !formData.category) {
      setError('Title and category are required');
      return;
    }

    try {
      await createGinhawaContent(formData);
      setFormData({
        title: '',
        contentType: 'article',
        contentUrl: '',
        description: '',
        category: '',
        riskLevels: [],
      });
      setShowForm(false);
      setSuccessMsg('Content created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadContent();
    } catch (err) {
      setError('Failed to create content');
    }
  };

  const handlePublish = async (contentId) => {
    try {
      await publishGinhawaContent(contentId);
      setSuccessMsg('Content published!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadContent();
    } catch (err) {
      setError('Failed to publish content');
    }
  };

  const handleArchive = async (contentId) => {
    try {
      await archiveGinhawaContent(contentId);
      setSuccessMsg('Content archived!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadContent();
    } catch (err) {
      setError('Failed to archive content');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#4caf50';
      case 'draft':
        return '#ff9800';
      case 'archived':
        return '#9e9e9e';
      default:
        return '#2196f3';
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Wellness Content Management</h2>
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
          {showForm ? 'Cancel' : '+ Add Content'}
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

      {/* Create Form */}
      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Create New Content</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                placeholder="Content title"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Content Type</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
              >
                {contentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>URL</label>
              <input
                type="text"
                value={formData.contentUrl}
                onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                placeholder="https://..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 100 }}
                placeholder="Content description"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Risk Levels</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {riskLevelOptions.map((level) => (
                  <label key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={formData.riskLevels.includes(level)}
                      onChange={(e) => {
                        const newLevels = e.target.checked
                          ? [...formData.riskLevels, level]
                          : formData.riskLevels.filter((l) => l !== level);
                        setFormData({ ...formData, riskLevels: newLevels });
                      }}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreateContent}
              style={{
                padding: '12px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Create Content
            </button>
          </div>
        </div>
      )}

      {/* Content Table */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Title</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Category</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Type</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Status</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((content) => (
              <tr key={content.contentId} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 12, color: '#333' }}>{content.title}</td>
                <td style={{ padding: 12, color: '#666' }}>{content.category}</td>
                <td style={{ padding: 12, color: '#666', fontSize: 12 }}>{content.contentType}</td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: getStatusColor(content.status),
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {content.status}
                  </span>
                </td>
                <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                  {content.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(content.contentId)}
                      style={{
                        padding: '6px 12px',
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Publish
                    </button>
                  )}
                  {content.status === 'published' && (
                    <button
                      onClick={() => handleArchive(content.contentId)}
                      style={{
                        padding: '6px 12px',
                        background: '#9e9e9e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
