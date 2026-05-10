"""
Flask API for Mental Health Predictive Analytics
Serves predictions and SHAP explanations to backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import logging
from datetime import datetime

from data_pipeline import DataPipeline
from predictor import MentalHealthPredictor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for models
pipeline = None
predictor = None

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'spartan_db')
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': predictor is not None and predictor.xgb_model is not None
    })

@app.route('/api/train', methods=['POST'])
def train_models():
    """
    Train Logistic Regression and XGBoost models
    POST /api/train
    """
    try:
        logger.info("🚀 Starting model training...")
        
        # Extract training data
        X, y, feature_names, df_full = pipeline.prepare_training_data()
        
        if X is None:
            return jsonify({
                'success': False,
                'message': 'No training data available'
            }), 400
        
        # Train models
        result = predictor.train_models(X, y, feature_names)
        
        return jsonify({
            'success': True,
            'message': 'Models trained successfully',
            'metrics': result,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict/student/<int:user_id>', methods=['GET'])
def predict_student(user_id):
    """
    Predict risk level for a specific student with SHAP explanation
    GET /api/predict/student/{user_id}
    """
    try:
        if predictor.xgb_model is None:
            return jsonify({
                'success': False,
                'error': 'Models not trained. Call /api/train first'
            }), 400
        
        # Get latest assessment for student
        assessment = pipeline.get_latest_student_assessment(user_id)
        
        if not assessment:
            return jsonify({
                'success': False,
                'error': f'No assessment found for user {user_id}'
            }), 404
        
        # Prepare features matching training pipeline
        feature_data = {
            'dass21_score': assessment.get('dass21_score', 0),
            'phq9_score': assessment.get('phq9_score', 0),
            'gad7_score': assessment.get('gad7_score', 0),
            'mood_slope': assessment.get('mood_slope', 0),
            'energy_slope': assessment.get('energy_slope', 0),
            'esm_entries_7d': assessment.get('esm_entries_7d', 0),
            'year_level': assessment.get('year_level', 2),
            'sex_encoded': 1 if assessment.get('sex') == 'M' else 0,
            'dass_trend': 0,
            'phq_trend': 0,
            'gad_trend': 0,
            'at_risk_percentage': 0,
            'high_risk_frequency': 0,
            'days_since_last': 0,
            'assessment_count': 1,
            'total_appointments': assessment.get('total_appointments', 0),
            'completed_appointments': assessment.get('completed_appointments', 0),
            'trajectory_numeric': {
                'Stable': 0,
                'Deteriorating': 1,
                'At-Risk': 2,
                'Insufficient Data': -1
            }.get(assessment.get('trajectory'), -1)
        }
        
        # Create DataFrame
        X = pd.DataFrame([feature_data])
        
        # Get prediction with SHAP explanation
        prediction = predictor.predict_with_shap(X)
        
        # Include baseline rule-based classification for comparison
        current_rule_based = assessment.get('risk_level', 'Unknown')
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'prediction': prediction,
            'current_rule_based_risk': current_rule_based,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for multiple students
    POST /api/predict/batch
    Body: { "user_ids": [1, 2, 3, ...] }
    """
    try:
        if predictor.xgb_model is None:
            return jsonify({
                'success': False,
                'error': 'Models not trained. Call /api/train first'
            }), 400
        
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        
        if not user_ids:
            return jsonify({
                'success': False,
                'error': 'No user_ids provided'
            }), 400
        
        predictions = []
        for user_id in user_ids:
            try:
                assessment = pipeline.get_latest_student_assessment(user_id)
                if assessment:
                    feature_data = {
                        'dass21_score': assessment.get('dass21_score', 0),
                        'phq9_score': assessment.get('phq9_score', 0),
                        'gad7_score': assessment.get('gad7_score', 0),
                        'mood_slope': assessment.get('mood_slope', 0),
                        'energy_slope': assessment.get('energy_slope', 0),
                        'esm_entries_7d': assessment.get('esm_entries_7d', 0),
                        'year_level': assessment.get('year_level', 2),
                        'sex_encoded': 1 if assessment.get('sex') == 'M' else 0,
                        'dass_trend': 0,
                        'phq_trend': 0,
                        'gad_trend': 0,
                        'at_risk_percentage': 0,
                        'high_risk_frequency': 0,
                        'days_since_last': 0,
                        'assessment_count': 1,
                        'total_appointments': assessment.get('total_appointments', 0),
                        'completed_appointments': assessment.get('completed_appointments', 0),
                        'trajectory_numeric': {
                            'Stable': 0,
                            'Deteriorating': 1,
                            'At-Risk': 2,
                            'Insufficient Data': -1
                        }.get(assessment.get('trajectory'), -1)
                    }
                    
                    X = pd.DataFrame([feature_data])
                    pred = predictor.predict_with_shap(X)
                    predictions.append({
                        'user_id': user_id,
                        'prediction': pred,
                        'status': 'success'
                    })
            except Exception as e:
                logger.warning(f"Error predicting for user {user_id}: {str(e)}")
                predictions.append({
                    'user_id': user_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/models/status', methods=['GET'])
def model_status():
    """Get current model status and information"""
    status = {
        'lr_model': predictor.lr_model is not None,
        'xgb_model': predictor.xgb_model is not None,
        'scaler': predictor.scaler is not None,
        'explainer': predictor.explainer is not None,
        'features_count': len(predictor.feature_names) if predictor.feature_names else 0,
        'feature_names': predictor.feature_names if predictor.feature_names else []
    }
    return jsonify({
        'success': True,
        'models': status,
        'timestamp': datetime.now().isoformat()
    })

def initialize_services():
    """Initialize data pipeline and predictor"""
    global pipeline, predictor
    
    logger.info("Initializing ML services...")
    
    # Initialize data pipeline
    pipeline = DataPipeline(DB_CONFIG)
    if not pipeline.connect():
        logger.error("Failed to connect to database")
        return False
    
    # Initialize predictor
    predictor = MentalHealthPredictor(model_dir='models')
    
    # Try to load existing models
    try:
        predictor.load_models()
        logger.info("✓ Models loaded from disk")
    except Exception as e:
        logger.warning(f"No existing models found: {str(e)}")
        logger.info("Run POST /api/train to train models")
    
    return True

if __name__ == '__main__':
    # Initialize services
    if not initialize_services():
        logger.error("Failed to initialize services")
        sys.exit(1)
    
    # Run Flask app
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
