import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RISK_COLORS = {
  Low: '#4caf50',
  Moderate: '#ff9800',
  High: '#f44336',
  Crisis: '#9c27b0',
};

const SHAP_COLORS = {
  HIGH: '#d32f2f',
  MODERATE: '#ff9800',
  LOW: '#4caf50',
};

const LEVELS = ['Low', 'Moderate', 'High', 'Crisis'];

export default function PopulationDashboard({ data }) {
  const [timeWindow, setTimeWindow] = useState('7');
  const windowData = data?.riskDistribution?.[`summary_${timeWindow}d`] || data?.[`summary_${timeWindow}d`] || {};

  const riskCounts = {
    Low: Number(windowData.Low || 0),
    Moderate: Number(windowData.Moderate || 0),
    High: Number(windowData.High || 0),
    Crisis: Number(windowData.Crisis || 0),
  };

  const totalStudents = Object.values(riskCounts).reduce((a, b) => a + b, 0);
  const totalStudentsMonitored = Number(data?.totalStudentsMonitored || 0);
  const totalAssessmentsThisMonth = Number(data?.totalAssessmentsThisMonth || 0);

  const riskPieData = useMemo(
    () => LEVELS.map((level) => ({ name: level, value: riskCounts[level], fill: RISK_COLORS[level] })),
    [riskCounts]
  );

  const renderStackedBars = (items, labelKey, emptyLabel) => {
    if (!items?.length) {
      return <p style={{ color: '#777' }}>{emptyLabel}</p>;
    }

    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={items}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={labelKey} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          {LEVELS.map((level) => (
            <Bar key={level} dataKey={level} stackId="a" fill={RISK_COLORS[level]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, background: '#fff', border: '1px solid #ddd', borderRadius: 12 }}>
          <div style={{ color: '#666', fontSize: 13, fontWeight: 600 }}>Total Students Monitored</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#d32f2f', marginTop: 6 }}>{totalStudentsMonitored}</div>
        </div>
        <div style={{ padding: 20, background: '#fff', border: '1px solid #ddd', borderRadius: 12 }}>
          <div style={{ color: '#666', fontSize: 13, fontWeight: 600 }}>Assessments This Month</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#1565C0', marginTop: 6 }}>{totalAssessmentsThisMonth}</div>
        </div>
        <div style={{ padding: 20, background: '#fff', border: '1px solid #ddd', borderRadius: 12 }}>
          <div style={{ color: '#666', fontSize: 13, fontWeight: 600 }}>Current Window</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#333', marginTop: 6 }}>Last {timeWindow} days</div>
        </div>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['7', '14', '30'].map((window) => (
          <button
            key={window}
            onClick={() => setTimeWindow(window)}
            style={{
              padding: '8px 16px',
              background: timeWindow === window ? '#d32f2f' : '#e8e8e8',
              color: timeWindow === window ? '#fff' : '#333',
              border: 'none',
              borderRadius: 999,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Last {window} days
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {LEVELS.map((level) => (
          <div key={level} style={{ padding: 20, background: '#fff', border: `2px solid ${RISK_COLORS[level]}`, borderRadius: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: RISK_COLORS[level] }}>{riskCounts[level]}</div>
            <div style={{ color: '#666', fontWeight: 600 }}>{level} Risk ({totalStudents > 0 ? Math.round((riskCounts[level] / totalStudents) * 100) : 0}%)</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0 }}>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={riskPieData} dataKey="value" nameKey="name" outerRadius={100} label>
                {riskPieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0 }}>Top SHAP Drivers</h3>
          {(data?.topShapDrivers || []).length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {(data.topShapDrivers || data?.predictiveAnalytics?.topShapDrivers || []).map((driver, index) => (
                <div key={`${driver.feature}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: '1px solid #eee', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{driver.feature}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>Count: {driver.count}</div>
                  </div>
                  <span style={{ padding: '6px 10px', borderRadius: 999, background: SHAP_COLORS[driver.avgImpact] || '#999', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {driver.avgImpact}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#777' }}>No SHAP driver data available.</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>By College</h3>
          {renderStackedBars(data?.cohortAnalysis?.byCollege || data?.byCollege || [], 'college', 'No college data available.')}
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>By Program</h3>
          {renderStackedBars(data?.cohortAnalysis?.byProgram || data?.byProgram || [], 'program', 'No program data available.')}
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>By Year Level</h3>
        {renderStackedBars(data?.cohortAnalysis?.byYearLevel || data?.byYearLevel || [], 'yearLevel', 'No year-level data available.')}
      </div>
    </div>
  );
}
