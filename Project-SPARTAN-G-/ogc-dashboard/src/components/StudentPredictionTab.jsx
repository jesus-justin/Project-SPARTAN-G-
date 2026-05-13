import React, { useState, useEffect } from 'react';
import './StudentPredictionTab.css';

/**
 * StudentPredictionTab Component
 * Displays detailed prediction history and SHAP explanations
 * Allows facilitators to understand model reasoning for each student
 */
export const StudentPredictionTab = ({ studentId, studentName }) => {
  const [explanation, setExplanation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchExplanation();
      fetchHistory();
    }
  }, [studentId]);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/predictions/explain/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setExplanation(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
      console.error('Explanation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/predictions/history/${studentId}?limit=10`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHistory(data.predictions);
        }
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  if (loading) {
    return (
      <div className="prediction-tab loading">
        <div className="spinner"></div>
        <p>Loading prediction details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-tab error">
        <h3>⚠️ Unable to Load Predictions</h3>
        <p>{error}</p>
        <button onClick={fetchExplanation} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  const { prediction_metadata, assessment_scores, shap_drivers, interpretation } = explanation;
  const riskLevel = prediction_metadata.risk_level;

  const riskColors = {
    Crisis: '#dc3545',
    High: '#fd7e14',
    Moderate: '#ffc107',
    Low: '#28a745',
  };

  return (
    <div className="prediction-tab">
      <div className="tab-header">
        <h2>🔮 Predictive Analysis - {studentName}</h2>
        <button onClick={fetchExplanation} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Prediction Interpretation */}
      <div className="section interpretation-section">
        <h3>📋 Summary</h3>
        <div className="interpretation-box" style={{ borderLeftColor: riskColors[riskLevel] }}>
          <p>{interpretation}</p>
        </div>
      </div>

      {/* Assessment Scores */}
      <div className="section scores-section">
        <h3>📊 Assessment Scores</h3>
        <div className="scores-grid">
          <div className="score-card">
            <span className="score-label">DASS-21</span>
            <span className="score-value">{assessment_scores.dass21_score || 'N/A'}</span>
            <span className="score-unit">Total</span>
          </div>
          <div className="score-card">
            <span className="score-label">PHQ-9</span>
            <span className="score-value">{assessment_scores.phq9_score || 'N/A'}</span>
            <span className="score-unit">Depression</span>
          </div>
          <div className="score-card">
            <span className="score-label">GAD-7</span>
            <span className="score-value">{assessment_scores.gad7_score || 'N/A'}</span>
            <span className="score-unit">Anxiety</span>
          </div>
          <div className="score-card">
            <span className="score-label">Mood Trend</span>
            <span className="score-value">{assessment_scores.mood_slope?.toFixed(2) || 'N/A'}</span>
            <span className="score-unit">{assessment_scores.mood_slope < 0 ? 'Declining' : 'Improving'}</span>
          </div>
        </div>
      </div>

      {/* SHAP Drivers - Top Contributing Factors */}
      <div className="section drivers-section">
        <h3>🔍 SHAP Explanation - Top Contributing Factors</h3>
        <p className="section-subtitle">
          These factors most strongly influenced the risk prediction. Positive values increase predicted risk; negative values decrease it.
        </p>
        <div className="drivers-detailed">
          {shap_drivers.map((driver, index) => (
            <div key={index} className="driver-detailed-card">
              <div className="driver-rank">#{index + 1}</div>
              <div className="driver-content">
                <h4>{driver.feature}</h4>
                <div className="driver-stats">
                  <div className="stat">
                    <span className="stat-label">Current Value:</span>
                    <span className="stat-value">{driver.feature_value !== null ? driver.feature_value.toFixed(2) : 'N/A'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">SHAP Impact:</span>
                    <span className={`stat-value ${driver.contribution}`}>
                      {driver.contribution === 'increases' ? '+' : '−'} {Math.abs(driver.shap_value).toFixed(4)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Direction:</span>
                    <span className={`direction ${driver.contribution}`}>
                      {driver.contribution === 'increases' ? '↑ Increases Risk' : '↓ Decreases Risk'}
                    </span>
                  </div>
                </div>
                <div className="driver-explanation">
                  <p>
                    This feature <strong>{driver.contribution === 'increases' ? 'increases' : 'decreases'}</strong> the predicted risk.
                    The SHAP value indicates{' '}
                    <strong>
                      {driver.contribution === 'increases'
                        ? 'this student is showing concerning signs'
                        : 'this student is showing protective factors'}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction History Timeline */}
      {history.length > 0 && (
        <div className="section history-section">
          <h3>📈 Prediction History</h3>
          <div className="history-timeline">
            {history.map((item, index) => (
              <div
                key={index}
                className={`history-item ${selectedHistoryId === index ? 'selected' : ''}`}
                onClick={() => setSelectedHistoryId(selectedHistoryId === index ? null : index)}
              >
                <div className="history-date">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className={`history-risk ${item.risk_level.toLowerCase()}`}>{item.risk_level}</div>
                <div className="history-trajectory">{item.trajectory}</div>
                {selectedHistoryId === index && (
                  <div className="history-details">
                    <div>DASS-21: {item.dass21_score}</div>
                    <div>PHQ-9: {item.phq9_score}</div>
                    <div>GAD-7: {item.gad7_score}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="section metadata-section">
        <h3>ℹ️ Prediction Details</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="label">Model:</span>
            <span className="value">XGBoost + SHAP</span>
          </div>
          <div className="metadata-item">
            <span className="label">Prediction ID:</span>
            <span className="value">{prediction_metadata.prediction_id}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Generated:</span>
            <span className="value">{new Date(prediction_metadata.created_at).toLocaleString()}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Risk Level:</span>
            <span className="value" style={{ color: riskColors[riskLevel] }}>
              {riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        <p>
          ⚖️ <strong>Important:</strong> This prediction is a decision-support tool, not a clinical diagnosis. Always combine
          machine learning predictions with clinical judgment and direct student interaction.
        </p>
      </div>
    </div>
  );
};

export default StudentPredictionTab;
