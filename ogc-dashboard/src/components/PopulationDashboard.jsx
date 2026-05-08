import { useState } from 'react';

export default function PopulationDashboard({ data }) {
  const [timeWindow, setTimeWindow] = useState('7');

  const windowData = data?.[`summary_${timeWindow}d`] || {};

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low':
        return '#4caf50';
      case 'Moderate':
        return '#ff9800';
      case 'High':
        return '#f44336';
      case 'Crisis':
        return '#9c27b0';
      default:
        return '#2196f3';
    }
  };

  const riskCounts = {
    Low: windowData.lowCount || 0,
    Moderate: windowData.moderateCount || 0,
    High: windowData.highCount || 0,
    Crisis: windowData.crisisCount || 0,
  };

  const totalStudents = Object.values(riskCounts).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Time Window Selector */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        {['7', '14', '30'].map((window) => (
          <button
            key={window}
            onClick={() => setTimeWindow(window)}
            style={{
              padding: '8px 16px',
              background: timeWindow === window ? '#d32f2f' : '#e8e8e8',
              color: timeWindow === window ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Last {window} days
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Object.entries(riskCounts).map(([level, count]) => (
          <div
            key={level}
            style={{
              padding: 20,
              background: '#fff',
              border: `2px solid ${getRiskColor(level)}`,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: getRiskColor(level), marginBottom: 8 }}>
              {count}
            </div>
            <div style={{ color: '#666', fontWeight: 500 }}>
              {level} Risk ({totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0}%)
            </div>
          </div>
        ))}
      </div>

      {/* Risk Distribution */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Risk Distribution</h3>
        <div style={{ display: 'flex', height: 40, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {Object.entries(riskCounts).map(([level, count]) => {
            const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
            return (
              <div
                key={level}
                style={{
                  flex: percentage,
                  background: getRiskColor(level),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: percentage > 10 ? 12 : 10,
                  minWidth: percentage > 5 ? 'auto' : 0,
                  overflow: 'hidden',
                }}
              >
                {percentage > 5 && `${Math.round(percentage)}%`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Demographic Breakdown */}
      {windowData.byCollege && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>By College</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(windowData.byCollege).map(([college, count]) => (
              <div key={college} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>{college}</span>
                <span style={{ fontWeight: 600, background: '#f0f0f0', padding: '4px 12px', borderRadius: 4 }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year Level Breakdown */}
      {windowData.byYearLevel && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>By Year Level</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(windowData.byYearLevel).map(([year, count]) => (
              <div key={year} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Year {year}</span>
                <span style={{ fontWeight: 600, background: '#f0f0f0', padding: '4px 12px', borderRadius: 4 }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
