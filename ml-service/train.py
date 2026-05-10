#!/usr/bin/env python
"""
Training script for Mental Health Predictive Models
Run this script to train Logistic Regression and XGBoost models
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from data_pipeline import DataPipeline
from predictor import MentalHealthPredictor

def main():
    print("\n" + "="*70)
    print("MENTAL HEALTH PREDICTIVE ANALYTICS - MODEL TRAINING")
    print("="*70 + "\n")
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'spartan_db')
    }
    
    print(f"📊 Database Configuration:")
    print(f"  Host: {db_config['host']}")
    print(f"  Database: {db_config['database']}")
    print()
    
    # Initialize pipeline
    print("🔗 Connecting to database...")
    pipeline = DataPipeline(db_config)
    if not pipeline.connect():
        print("✗ Failed to connect to database")
        return False
    
    # Extract and prepare data
    print("\n📈 Preparing training data...")
    X, y, feature_names, df_full = pipeline.prepare_training_data()
    
    if X is None or len(X) == 0:
        print("✗ No training data available")
        pipeline.disconnect()
        return False
    
    # Initialize predictor
    print("\n🤖 Initializing predictor...")
    predictor = MentalHealthPredictor(model_dir='models')
    
    # Train models
    print("\n" + "-"*70)
    result = predictor.train_models(X, y, feature_names)
    print("-"*70)
    
    # Summary
    print("\n✅ TRAINING COMPLETE\n")
    print("Summary:")
    print(f"  Training samples: {result['training_samples']}")
    print(f"  Test samples: {result['test_samples']}")
    print(f"  Logistic Regression AUC: {result['lr_auc']:.4f}")
    print(f"  XGBoost AUC: {result['xgb_auc']:.4f}")
    print(f"  XGBoost AUC Improvement: +{(result['xgb_auc'] - result['lr_auc'])*100:.2f}%\n")
    
    print("📁 Models saved to: ./models/")
    print("   - lr_model.pkl")
    print("   - scaler.pkl")
    print("   - xgb_model.json")
    print("   - feature_names.json")
    print("   - training_report.txt\n")
    
    print("🚀 Models ready for inference!")
    print("   Start Flask server: python app.py")
    print("   Train endpoint: POST http://localhost:5000/api/train")
    print("   Predict endpoint: GET http://localhost:5000/api/predict/student/{user_id}\n")
    
    # Clean up
    pipeline.disconnect()
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
