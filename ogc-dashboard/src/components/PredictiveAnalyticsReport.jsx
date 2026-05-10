import React, { useState, useEffect } from 'react';
import './PredictiveAnalyticsReport.css';

const PredictiveAnalyticsReport = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [sortBy, setSortBy] = useState('risk_probability');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch analytics report from backend
      const response = await fetch('http://localhost:3001/api/predictions/report/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch predictions');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return '#4CAF50';
      case 'Moderate':
        return '#FFC107';
      case 'High':
        return '#FF9800';
      case 'Crisis':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return '#E8F5E9';
      case 'Moderate':
        return '#FFF3E0';
      case 'High':
        return '#FFE0B2';
      case 'Crisis':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  // Calculate risk statistics
  const calculateStats = () => {
    if (!analyticsData?.summary) return {};
    return analyticsData.summary;
  };

  const filterAndSortStudents = () => {
    if (!analyticsData?.students) return [];
    
    let filtered = analyticsData.students;
    
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter(s => s.predicted_risk_level === selectedRiskLevel);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'risk_probability') {
        return b.prediction_probability - a.prediction_probability;
      } else if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
    
    return filtered;
  };

  if (loading) {
    return <div className="predictive-report-container"><p>Loading analytics...</p></div>;
  }

  if (error) {
    return <div className="predictive-report-container error"><p>Error: {error}</p></div>;
  }

  const stats = calculateStats();
  const filteredStudents = filterAndSortStudents();

  return (
    <div className="predictive-report-container">
      <h1>📊 Predictive Analytics Report</h1>
      
      {/* Overview Statistics */}
      <section className="stats-grid">
        <div className="stat-card total">
          <h3>Total Students</h3>
          <p className="stat-value">{stats.totalStudents}</p>
        </div>
        
        <div className="stat-card at-risk">
          <h3>At-Risk Students</h3>
          <p className="stat-value">{stats.atRisk}</p>
          <p className="stat-percentage">{stats.percentageAtRisk}%</p>
        </div>
        
        <div className="stat-card crisis">
          <h3>Crisis Level</h3>
          <p className="stat-value">{stats.crisis}</p>
          <p className="stat-label">Immediate attention</p>
        </div>
        
        <div className="stat-card high">
          <h3>High Risk</h3>
          <p className="stat-value">{stats.high}</p>
          <p className="stat-label">Close monitoring</p>
        </div>
        
        <div className="stat-card moderate">
          <h3>Moderate Risk</h3>
          <p className="stat-value">{stats.moderate}</p>
          <p className="stat-label">Regular check-in</p>
        </div>
        
        <div className="stat-card low">
          <h3>Low Risk</h3>
          <p className="stat-value">{stats.low}</p>
          <p className="stat-label">Stable</p>
        </div>
      </section>

      {/* Risk Distribution Visualization */}
      <section className="risk-distribution">
        <h2>Risk Level Distribution</h2>
        <div className="distribution-bars">
          <div className="bar-container">
            <div className="bar low" style={{ width: `${(stats.low / stats.totalStudents) * 100}%` }}>
              <span>{stats.low}</span>
            </div>
            <p>Low</p>
          </div>
          <div className="bar-container">
            <div className="bar moderate" style={{ width: `${(stats.moderate / stats.totalStudents) * 100}%` }}>
              <span>{stats.moderate}</span>
            </div>
            <p>Moderate</p>
          </div>
          <div className="bar-container">
            <div className="bar high" style={{ width: `${(stats.high / stats.totalStudents) * 100}%` }}>
              <span>{stats.high}</span>
            </div>
            <p>High</p>
          </div>
          <div className="bar-container">
            <div className="bar crisis" style={{ width: `${(stats.crisis / stats.totalStudents) * 100}%` }}>
              <span>{stats.crisis}</span>
            </div>
            <p>Crisis</p>
          </div>
        </div>
      </section>

      {/* Filters and Sort */}
      <section className="filters-section">
        <div className="filter-group">
          <label>Filter by Risk Level:</label>
          <select value={selectedRiskLevel} onChange={(e) => setSelectedRiskLevel(e.target.value)}>
            <option value="all">All Students ({stats.totalStudents})</option>
            <option value="Crisis">Crisis ({stats.crisis})</option>
            <option value="High">High Risk ({stats.high})</option>
            <option value="Moderate">Moderate ({stats.moderate})</option>
            <option value="Low">Low Risk ({stats.low})</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="risk_probability">Risk Probability (High to Low)</option>
            <option value="name">Student Name (A-Z)</option>
          </select>
        </div>
      </section>

      {/* Student Detailed Table */}
      <section className="students-table-section">
        <h2>Student Risk Details ({filteredStudents.length})</h2>
        
        {filteredStudents.length === 0 ? (
          <p className="no-data">No students match the selected filter.</p>
        ) : (
          <div className="table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>ID</th>
                  <th>Risk Level</th>
                  <th>Probability</th>
                  <th>Top Driver</th>
                  <th>Recommendation</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} className={`risk-${student.predicted_risk_level?.toLowerCase()}`}>
                    <td className="student-name">
                      <strong>{student.name || 'N/A'}</strong>
                    </td>
                    <td className="student-id">{student.user_id}</td>
                    <td>
                      <span 
                        className="risk-badge"
                        style={{
                          backgroundColor: getRiskBgColor(student.predicted_risk_level),
                          color: getRiskColor(student.predicted_risk_level),
                          fontWeight: 'bold'
                        }}
                      >
                        {student.predicted_risk_level || 'N/A'}
                      </span>
                    </td>
                    <td className="probability">
                      <div className="prob-bar">
                        <div 
                          className="prob-fill"
                          style={{
                            width: `${(student.prediction_probability || 0) * 100}%`,
                            backgroundColor: getRiskColor(student.predicted_risk_level)
                          }}
                        />
                      </div>
                      <span>{((student.prediction_probability || 0) * 100).toFixed(1)}%</span>
                    </td>
                    <td className="top-driver">
                      {student.shap_drivers?.[0]?.feature || 'N/A'}
                    </td>
                    <td className="recommendation">
                      <small>{student.recommendation || 'Monitor regularly'}</small>
                    </td>
                    <td className="timestamp">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top SHAP Drivers Analysis */}
      <section className="shap-analysis">
        <h2>🔍 Top Feature Drivers (Across All Students)</h2>
        <div className="drivers-grid">
          {analyticsData?.top_drivers?.slice(0, 5).map((driver, idx) => (
            <div key={idx} className="driver-card">
              <div className="driver-rank">{idx + 1}</div>
              <h4>{driver.feature}</h4>
              <p className="driver-impact">
                Impact: <strong>{(driver.avg_shap_value || 0).toFixed(4)}</strong>
              </p>
              <p className="driver-description">
                Appears in {driver.frequency || 0} predictions
              </p>
              <div className="impact-bar">
                <div 
                  className="impact-fill"
                  style={{
                    width: `${Math.min(100, ((driver.avg_shap_value || 0) * 100))}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Items for Facilitators */}
      <section className="action-items">
        <h2>✅ Recommended Actions for Facilitators</h2>
        <div className="actions-list">
          {stats.crisis > 0 && (
            <div className="action-item priority-high">
              <span className="priority-badge">URGENT</span>
              <p><strong>{stats.crisis} student(s)</strong> require immediate mental health support and intervention.</p>
            </div>
          )}
          
          {stats.high > 0 && (
            <div className="action-item priority-medium">
              <span className="priority-badge">HIGH</span>
              <p><strong>{stats.high} student(s)</strong> need close monitoring and follow-up appointments.</p>
            </div>
          )}
          
          {stats.moderate > 0 && (
            <div className="action-item priority-low">
              <span className="priority-badge">MEDIUM</span>
              <p><strong>{stats.moderate} student(s)</strong> should have regular check-ins scheduled.</p>
            </div>
          )}
          
          <div className="action-item general">
            <span className="priority-badge">INFO</span>
            <p>Review SHAP drivers to understand key factors affecting student mental health outcomes.</p>
          </div>
        </div>
      </section>

      {/* Model Information */}
      <section className="model-info">
        <h2>ℹ️ Model Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <h4>Primary Model</h4>
            <p>XGBoost with SHAP Explainability</p>
          </div>
          <div className="info-card">
            <h4>Features Analyzed</h4>
            <p>16 psychometric & behavioral indicators</p>
          </div>
          <div className="info-card">
            <h4>Data Source</h4>
            <p>DASS-21, PHQ-9, GAD-7, ESM Checkins</p>
          </div>
          <div className="info-card">
            <h4>Update Frequency</h4>
            <p>Real-time with new assessments</p>
          </div>
        </div>
      </section>

      {/* Refresh Button */}
      <section className="refresh-section">
        <button className="refresh-btn" onClick={fetchAnalyticsData}>
          🔄 Refresh Report
        </button>
        <p className="last-update">
          Last updated: {new Date().toLocaleString()}
        </p>
      </section>
    </div>
  );
};

export default PredictiveAnalyticsReport;
