import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGinhawaContent } from '../api/ginhawa.api';

export default function GinhawaPage() {
  const [contentByCategory, setContentByCategory] = useState({});
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resources');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await getGinhawaContent();
        if (res?.data?.grouped) {
          setContentByCategory(res.data.grouped);
          setSelectedCategories(new Set(Object.keys(res.data.grouped)));
        }
      } catch (err) {
        setError('Failed to load content: ' + (err?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleCategoryToggle = (category) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setSelectedCategories(newSet);
  };

  const categories = Object.keys(contentByCategory);

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>GINHAWA - Wellness Resources</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #ddd', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('resources')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'resources' ? '3px solid #d32f2f' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'resources' ? 600 : 400,
            color: activeTab === 'resources' ? '#d32f2f' : '#666',
          }}
        >
          Resources
        </button>
        <button
          onClick={() => setActiveTab('safety-plan')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'safety-plan' ? '3px solid #d32f2f' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'safety-plan' ? 600 : 400,
            color: activeTab === 'safety-plan' ? '#d32f2f' : '#666',
          }}
        >
          My Safety Plan
        </button>
      </div>

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div>
          {loading && <p>Loading resources...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <div>
              {/* Category Filter */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: selectedCategories.has(cat) ? '2px solid #d32f2f' : '2px solid #ccc',
                      background: selectedCategories.has(cat) ? '#ffebee' : '#f5f5f5',
                      cursor: 'pointer',
                      fontWeight: 500,
                      color: selectedCategories.has(cat) ? '#d32f2f' : '#666',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Content Grid */}
              <div>
                {categories
                  .filter((cat) => selectedCategories.has(cat))
                  .map((category) => (
                    <div key={category} style={{ marginBottom: 32 }}>
                      <h3 style={{ marginBottom: 16, color: '#333', borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
                        {category}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {(contentByCategory[category] || []).map((item) => (
                          <div
                            key={item.contentId}
                            onClick={() => navigate(`/content/${item.contentId}`, { state: { content: item } })}
                            style={{
                              padding: 16,
                              border: '1px solid #ddd',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'all 0.3s',
                              background: '#fff',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ fontSize: 28 }}>
                                {item.contentType === 'video' && '▶️'}
                                {item.contentType === 'article' && '📄'}
                                {item.contentType === 'brochure' && '📑'}
                                {item.contentType === 'exercise' && '💪'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{item.title}</h4>
                                <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#999' }}>{category}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Plan Tab */}
      {activeTab === 'safety-plan' && (
        <div>
          <button
            onClick={() => navigate('/safety-plan')}
            style={{
              padding: '12px 24px',
              background: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Go to Safety Plan
          </button>
        </div>
      )}
    </div>
  );
}
