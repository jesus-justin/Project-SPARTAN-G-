import React from 'react';
import { useNavigate } from 'react-router-dom';
import PredictiveAnalyticsReport from '../components/PredictiveAnalyticsReport';
import './PredictiveAnalyticsPage.css';

const PredictiveAnalyticsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="predictive-analytics-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Predictive Mental Health Analytics</h1>
      </div>
      
      <PredictiveAnalyticsReport />
      
      <div className="page-footer">
        <p>
          This report uses machine learning (XGBoost) to predict student mental health risk levels
          based on assessment data. Predictions are explained using SHAP (SHapley Additive exPlanations).
        </p>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;
