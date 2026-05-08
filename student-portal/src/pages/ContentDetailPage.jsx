import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGinhawaContentDetail } from '../api/ginhawa.api';

export default function ContentDetailPage() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getGinhawaContentDetail(id);
        if (res?.data) {
          setContent(res.data);
        }
      } catch (err) {
        setError('Failed to load content: ' + (err?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
        <p style={{ color: 'red' }}>{error}</p>
        <a href="/ginhawa" style={{ color: '#d32f2f', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Resources
        </a>
      </div>
    );
  }

  if (!content) {
    return (
      <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
        <p>Content not found</p>
        <a href="/ginhawa" style={{ color: '#d32f2f', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Resources
        </a>
      </div>
    );
  }

  const iconMap = {
    video: '▶️',
    article: '📄',
    brochure: '📑',
    exercise: '💪',
  };

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <a href="/ginhawa" style={{ color: '#d32f2f', textDecoration: 'none', fontWeight: 600, display: 'block', marginBottom: 20 }}>
        ← Back to Resources
      </a>

      <div style={{ background: '#fff', padding: 32, borderRadius: 8, border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>{iconMap[content.contentType] || '📚'}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, marginBottom: 8, color: '#333' }}>{content.title}</h1>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '4px 12px',
                  background: '#f0f0f0',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#666',
                  fontWeight: 500,
                }}
              >
                {content.contentType}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  background: '#e8eef5',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#1565c0',
                  fontWeight: 500,
                }}
              >
                {content.category}
              </span>
            </div>
            {content.riskLevels && content.riskLevels.length > 0 && (
              <p style={{ margin: '8px 0', fontSize: 12, color: '#999' }}>
                Recommended for: {content.riskLevels.join(', ')}
              </p>
            )}
          </div>
        </div>

        {content.description && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>Description</h3>
            <p style={{ lineHeight: 1.6, color: '#555' }}>{content.description}</p>
          </div>
        )}

        {content.contentUrl && (
          <div style={{ marginBottom: 24 }}>
            <a
              href={content.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#d32f2f',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open Resource →
            </a>
          </div>
        )}

        <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
            Published: {new Date(content.publishedAt).toLocaleDateString()} | Created: {new Date(content.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
