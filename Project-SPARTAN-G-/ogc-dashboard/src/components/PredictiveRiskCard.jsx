import React, { useState, useEffect } from 'react';
import './PredictiveRiskCard.css';

/**
 * PredictiveRiskCard Component
 * Displays ML-powered risk predictions with SHAP explainability
 * Shows contributing factors and recommendations
 */
export const PredictiveRiskCard = ({ studentId, onRefresh }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFactors, setExpandedFactors] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchPrediction();
    }
  }, [studentId]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/predictions/student/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prediction: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="predictive-risk-card loading">
        <div className="spinner"></div>
        <p>Loading prediction...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="predictive-risk-card error">
        <h3>⚠️ Prediction Unavailable</h3>
        <p>{error}</p>
        <button onClick={fetchPrediction} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const riskLevel = prediction.predicted_risk_level;
  const probability = (prediction.prediction_probability * 100).toFixed(1);
  const confidence = prediction.prediction_probability > 0.7 ? 'High' : prediction.prediction_probability > 0.5 ? 'Moderate' : 'Low';

  // Color coding by risk level
  const riskColors = {
    Crisis: '#dc3545',
    High: '#fd7e14',
    Moderate: '#ffc107',
    Low: '#28a745',
  };

  const riskEmojis = {
    Crisis: '🚨',
    High: '⚠️',
    Moderate: '📊',
    Low: '✅',
  };

  return (
    <div className="predictive-risk-card" style={{ borderLeftColor: riskColors[riskLevel] }}>
      <div className="card-header">
        <h3>
          {riskEmojis[riskLevel]} Predictive Risk Assessment
          <span className="model-badge">XGBoost + SHAP</span>
        </h3>
      </div>

      <div className="card-content">
        <div className="risk-display">
          <div className="risk-level" style={{ color: riskColors[riskLevel] }}>
            {riskLevel}
          </div>
          <div className="probability">
            <span className="label">Confidence:</span>
            <span className="value">{probability}%</span>
            <span className={`confidence-badge ${confidence.toLowerCase()}`}>{confidence}</span>
          </div>
        </div>

        <div className="recommendation">
          <p className="label">🎯 Recommendation:</p>
          <p className="value">{prediction.recommendation}</p>
        </div>

        {/* SHAP Drivers (Contributing Factors) */}
        {prediction.shap_drivers && prediction.shap_drivers.length > 0 && (
          <div className="shap-drivers">
            <div className="drivers-header" onClick={() => setExpandedFactors(!expandedFactors)}>
              <p className="label">📊 Contributing Factors (SHAP)</p>
              <span className={`toggle ${expandedFactors ? 'open' : ''}`}>▼</span>
            </div>

            {expandedFactors && (
              <div className="drivers-list">
                {prediction.shap_drivers.map((driver, index) => (
                  <div key={index} className="driver-item">
                    <div className="driver-header">
                      <span className="feature-name">{driver.feature}</span>
                      <span className={`impact-badge ${driver.impact?.toLowerCase() || ''}`}>
                        {driver.impact || 'MODERATE'}
                      </span>
                    </div>
                    <div className="driver-details">
                      <span className="value">{driver.feature_value !== null ? driver.feature_value.toFixed(2) : 'N/A'}</span>
                      <span className={`contribution ${driver.contribution}`}>
                        {driver.contribution === 'increases' ? '↑ Increases risk' : '↓ Decreases risk'}
                      </span>
                      <span className="shap-value">SHAP: {driver.shap_value.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="comparison-info">
          <small>💡 Tip: Compare with rule-based assessment for validation</small>
        </div>
      </div>

      <div className="card-footer">
        <button onClick={fetchPrediction} className="refresh-btn">
          🔄 Refresh Prediction
        </button>
      </div>
    </div>
  );
};

export default PredictiveRiskCard;
