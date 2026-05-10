"""
Mental Health Predictive Models
Logistic Regression (baseline) + XGBoost (primary) with SHAP explainability
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime
import joblib
import os

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, 
    precision_score, recall_score, f1_score, roc_curve, auc
)

import xgboost as xgb
import shap

class MentalHealthPredictor:
    def __init__(self, model_dir='models'):
        self.model_dir = model_dir
        self.lr_model = None
        self.xgb_model = None
        self.scaler = None
        self.feature_names = None
        self.explainer = None
        
        # Create models directory if doesn't exist
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)

    def train_models(self, X, y, feature_names, test_size=0.2, random_state=42):
        """
        Train Logistic Regression and XGBoost models with cross-validation
        """
        print("\n🤖 Training Predictive Models...")
        print(f"Training set size: {len(X)}, Features: {X.shape[1]}")
        
        self.feature_names = feature_names
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"✓ Train/Test split: {len(X_train)}/{len(X_test)}")
        
        # Standardize features for Logistic Regression
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # ========== LOGISTIC REGRESSION (Baseline) ==========
        print("\n📊 Training Logistic Regression (Baseline)...")
        self.lr_model = LogisticRegression(
            max_iter=1000, 
            random_state=random_state,
            class_weight='balanced'  # Handle class imbalance
        )
        self.lr_model.fit(X_train_scaled, y_train)
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.lr_model, X_train_scaled, y_train,
            cv=StratifiedKFold(n_splits=5),
            scoring='roc_auc'
        )
        
        lr_pred = self.lr_model.predict(X_test_scaled)
        lr_pred_proba = self.lr_model.predict_proba(X_test_scaled)[:, 1]
        
        print(f"  ✓ Cross-validation AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
        print(f"  ✓ Test ROC-AUC: {roc_auc_score(y_test, lr_pred_proba):.4f}")
        print(f"  ✓ Test F1-Score: {f1_score(y_test, lr_pred):.4f}")
        print(f"  ✓ Test Precision: {precision_score(y_test, lr_pred):.4f}")
        print(f"  ✓ Test Recall: {recall_score(y_test, lr_pred):.4f}")
        
        # ========== XGBOOST (Primary Model) ==========
        print("\n🚀 Training XGBoost (Primary Model)...")
        
        # Create DMatrix for XGBoost
        dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=feature_names)
        dtest = xgb.DMatrix(X_test, label=y_test, feature_names=feature_names)
        
        # Parameters tuned for mental health classification
        params = {
            'objective': 'binary:logistic',
            'eval_metric': 'auc',
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'scale_pos_weight': len(y_train[y_train == 0]) / len(y_train[y_train == 1]),  # Handle imbalance
            'random_state': random_state,
            'verbosity': 0
        }
        
        # Train with early stopping
        evals = [(dtrain, 'train'), (dtest, 'test')]
        self.xgb_model = xgb.train(
            params,
            dtrain,
            num_boost_round=500,
            evals=evals,
            early_stopping_rounds=50,
            verbose_eval=False
        )
        
        # Predictions
        xgb_pred = self.xgb_model.predict(dtest)
        xgb_pred_binary = (xgb_pred > 0.5).astype(int)
        
        print(f"  ✓ Test ROC-AUC: {roc_auc_score(y_test, xgb_pred):.4f}")
        print(f"  ✓ Test F1-Score: {f1_score(y_test, xgb_pred_binary):.4f}")
        print(f"  ✓ Test Precision: {precision_score(y_test, xgb_pred_binary):.4f}")
        print(f"  ✓ Test Recall: {recall_score(y_test, xgb_pred_binary):.4f}")
        print(f"  ✓ Boosting rounds: {self.xgb_model.best_iteration}")
        
        # ========== SHAP Explainability ==========
        print("\n🔍 Generating SHAP Explainer...")
        self.explainer = shap.TreeExplainer(self.xgb_model)
        print("  ✓ TreeExplainer ready for real-time explanations")
        
        # Feature importance from XGBoost
        importance = self.xgb_model.get_score(importance_type='weight')
        importance_df = pd.DataFrame(
            list(importance.items()), 
            columns=['Feature', 'Importance']
        ).sort_values('Importance', ascending=False)
        
        print("\n📌 Top 5 Most Important Features (by usage):")
        for idx, row in importance_df.head(5).iterrows():
            print(f"  {row['Feature']}: {row['Importance']}")
        
        # Save models
        self.save_models()
        
        # Generate detailed report
        self._generate_training_report(X_test, y_test, X_test_scaled, lr_pred_proba, xgb_pred)
        
        return {
            'status': 'success',
            'lr_auc': roc_auc_score(y_test, lr_pred_proba),
            'xgb_auc': roc_auc_score(y_test, xgb_pred),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }

    def _generate_training_report(self, X_test, y_test, X_test_scaled, lr_proba, xgb_proba):
        """Generate detailed training report"""
        report_path = os.path.join(self.model_dir, 'training_report.txt')
        
        with open(report_path, 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("MENTAL HEALTH PREDICTIVE MODEL - TRAINING REPORT\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write("=" * 70 + "\n\n")
            
            f.write("MODELS TRAINED:\n")
            f.write("1. Logistic Regression (Baseline)\n")
            f.write("   - Reference: Hosmer, Lemeshow, & Sturdivant (2013)\n")
            f.write("   - Purpose: Interpretable baseline for comparison\n\n")
            
            f.write("2. XGBoost (Primary)\n")
            f.write("   - Reference: Chen & Guestrin (2016), Shatte et al. (2019)\n")
            f.write("   - Purpose: High-accuracy predictions on behavioral data\n\n")
            
            f.write("3. SHAP Explainability\n")
            f.write("   - Reference: Lundberg & Lee (2017)\n")
            f.write("   - Purpose: Feature importance and prediction explanations\n\n")
            
            f.write("TEST SET PERFORMANCE:\n")
            lr_auc = roc_auc_score(y_test, lr_proba)
            xgb_auc = roc_auc_score(y_test, xgb_proba)
            f.write(f"  Logistic Regression AUC: {lr_auc:.4f}\n")
            f.write(f"  XGBoost AUC: {xgb_auc:.4f}\n")
            f.write(f"  Test Set Size: {len(X_test)}\n")
            f.write(f"  Positive Cases: {(y_test == 1).sum()}\n")
            f.write(f"  Negative Cases: {(y_test == 0).sum()}\n\n")
            
            f.write("TARGET VARIABLE:\n")
            f.write("  0 = Low/Moderate Risk (no intervention needed)\n")
            f.write("  1 = High/Crisis Risk (requires intervention)\n\n")
            
            f.write("FEATURES USED:\n")
            for i, feature in enumerate(self.feature_names, 1):
                f.write(f"  {i}. {feature}\n")

    def predict_batch(self, X):
        """
        Make predictions on batch of samples
        Returns predictions with confidence scores
        """
        if self.xgb_model is None or self.scaler is None:
            raise ValueError("Models not trained or loaded")
        
        X_scaled = self.scaler.transform(X)
        
        # XGBoost predictions
        dmatrix = xgb.DMatrix(X, feature_names=self.feature_names)
        xgb_proba = self.xgb_model.predict(dmatrix)
        
        # Logistic Regression predictions for comparison
        lr_proba = self.lr_model.predict_proba(X_scaled)[:, 1]
        
        predictions = []
        for i in range(len(X)):
            pred_dict = {
                'xgb_probability': float(xgb_proba[i]),
                'lr_probability': float(lr_proba[i]),
                'ensemble_probability': float((xgb_proba[i] + lr_proba[i]) / 2),
                'xgb_prediction': int(xgb_proba[i] > 0.5),
                'ensemble_prediction': int((xgb_proba[i] + lr_proba[i]) / 2 > 0.5)
            }
            predictions.append(pred_dict)
        
        return predictions

    def predict_with_shap(self, X):
        """
        Make single prediction with SHAP explainability
        X: Single sample (DataFrame or array with feature names)
        Returns: Prediction + SHAP values for interpretability
        """
        if self.xgb_model is None or self.explainer is None:
            raise ValueError("Models not trained or loaded")
        
        # Ensure X is a DMatrix
        if not isinstance(X, xgb.DMatrix):
            if isinstance(X, pd.DataFrame):
                X_matrix = xgb.DMatrix(X, feature_names=self.feature_names)
            else:
                X_df = pd.DataFrame([X], columns=self.feature_names)
                X_matrix = xgb.DMatrix(X_df, feature_names=self.feature_names)
        else:
            X_matrix = X
        
        # Get probability prediction
        prediction_prob = self.xgb_model.predict(X_matrix)[0]
        
        # Get SHAP values
        shap_values = self.explainer.shap_values(X_matrix)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Get positive class SHAP values
        
        # Get feature values
        if isinstance(X, pd.DataFrame):
            feature_values = X.iloc[0].values
        else:
            feature_values = X[0] if isinstance(X, np.ndarray) else X
        
        # Create feature importance list
        feature_importance = []
        for i, (feature_name, shap_val, feature_val) in enumerate(
            zip(self.feature_names, shap_values[0], feature_values)
        ):
            feature_importance.append({
                'feature': feature_name,
                'shap_value': float(shap_val),
                'feature_value': float(feature_val),
                'contribution': 'increases' if shap_val > 0 else 'decreases'
            })
        
        # Sort by absolute SHAP value (impact)
        feature_importance.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        
        # Determine risk level and recommendation
        if prediction_prob > 0.75:
            risk_level = 'Crisis'
            recommendation = 'Immediate intervention required'
        elif prediction_prob > 0.5:
            risk_level = 'High'
            recommendation = 'Close monitoring and follow-up recommended'
        elif prediction_prob > 0.3:
            risk_level = 'Moderate'
            recommendation = 'Regular check-ins advised'
        else:
            risk_level = 'Low'
            recommendation = 'Routine monitoring'
        
        return {
            'prediction_probability': float(prediction_prob),
            'predicted_risk_level': risk_level,
            'recommendation': recommendation,
            'shap_drivers': feature_importance[:5],  # Top 5 contributing factors
            'model': 'XGBoost with SHAP'
        }

    def save_models(self):
        """Save trained models to disk"""
        joblib.dump(self.lr_model, os.path.join(self.model_dir, 'lr_model.pkl'))
        joblib.dump(self.scaler, os.path.join(self.model_dir, 'scaler.pkl'))
        self.xgb_model.save_model(os.path.join(self.model_dir, 'xgb_model.json'))
        
        # Save feature names
        with open(os.path.join(self.model_dir, 'feature_names.json'), 'w') as f:
            json.dump(self.feature_names, f)
        
        print("✓ Models saved to disk")

    def load_models(self):
        """Load trained models from disk"""
        self.lr_model = joblib.load(os.path.join(self.model_dir, 'lr_model.pkl'))
        self.scaler = joblib.load(os.path.join(self.model_dir, 'scaler.pkl'))
        self.xgb_model = xgb.Booster()
        self.xgb_model.load_model(os.path.join(self.model_dir, 'xgb_model.json'))
        
        with open(os.path.join(self.model_dir, 'feature_names.json'), 'r') as f:
            self.feature_names = json.load(f)
        
        # Initialize SHAP explainer
        self.explainer = shap.TreeExplainer(self.xgb_model)
        
        print("✓ Models loaded from disk")
        return True
