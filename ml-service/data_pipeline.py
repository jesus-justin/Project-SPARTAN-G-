"""
Data Pipeline for Mental Health Predictive Analytics
Extracts, processes, and prepares training data from database
"""

import mysql.connector
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

class DataPipeline:
    def __init__(self, db_config):
        self.db_config = db_config
        self.conn = None

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = mysql.connector.connect(**self.db_config)
            print("✓ Database connected")
            return True
        except mysql.connector.Error as err:
            print(f"✗ Database connection error: {err}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

    def extract_student_assessment_data(self):
        """
        Extract assessment data for each student.
        Returns feature matrix: each row = student record, columns = assessment features + derived features
        """
        query = """
        SELECT 
            rc.user_id,
            rc.dass21_score,
            rc.phq9_score,
            rc.gad7_score,
            rc.mood_slope,
            rc.energy_slope,
            rc.trajectory,
            rc.risk_level,
            rc.created_at,
            u.college,
            u.year_level,
            u.program,
            u.sex,
            COUNT(DISTINCT CASE WHEN ec.created_at >= DATE_SUB(rc.created_at, INTERVAL 7 DAY) THEN ec.id END) as esm_entries_7d,
            COUNT(DISTINCT ap.appointment_id) as total_appointments,
            SUM(CASE WHEN ap.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments
        FROM risk_classifications rc
        INNER JOIN users u ON rc.user_id = u.id
        LEFT JOIN esm_checkins ec ON rc.user_id = ec.user_id
        LEFT JOIN appointments ap ON rc.user_id = ap.user_id
        WHERE rc.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY rc.id, rc.user_id
        ORDER BY rc.created_at DESC
        """
        
        cursor = self.conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        
        return pd.DataFrame(results)

    def calculate_trend_features(self, df):
        """
        Calculate additional trend features for each student
        """
        trend_data = []
        
        for user_id in df['user_id'].unique():
            user_df = df[df['user_id'] == user_id].sort_values('created_at')
            
            if len(user_df) < 2:
                continue
            
            # Calculate assessment score trends
            dass_trend = self._calculate_trend(user_df['dass21_score'].values)
            phq_trend = self._calculate_trend(user_df['phq9_score'].values)
            gad_trend = self._calculate_trend(user_df['gad7_score'].values)
            
            # Calculate trajectory transitions
            trajectory_counts = user_df['trajectory'].value_counts().to_dict()
            at_risk_percentage = (trajectory_counts.get('At-Risk', 0) + trajectory_counts.get('Deteriorating', 0)) / len(user_df) * 100
            
            # High risk event frequency
            high_risk_events = (user_df['risk_level'].isin(['High', 'Crisis'])).sum()
            high_risk_frequency = high_risk_events / len(user_df) * 100
            
            # Days since last assessment
            days_since_last = (datetime.now() - user_df['created_at'].iloc[-1]).days
            
            trend_data.append({
                'user_id': user_id,
                'dass_trend': dass_trend,
                'phq_trend': phq_trend,
                'gad_trend': gad_trend,
                'at_risk_percentage': at_risk_percentage,
                'high_risk_frequency': high_risk_frequency,
                'days_since_last': days_since_last,
                'assessment_count': len(user_df)
            })
        
        return pd.DataFrame(trend_data)

    def _calculate_trend(self, scores):
        """Calculate linear trend of scores (positive = increasing)"""
        if len(scores) < 2:
            return 0.0
        valid_scores = [s for s in scores if s is not None]
        if len(valid_scores) < 2:
            return 0.0
        x = np.arange(len(valid_scores))
        y = np.array(valid_scores)
        return float(np.polyfit(x, y, 1)[0])

    def prepare_training_data(self):
        """
        Main pipeline to extract and prepare complete training dataset
        """
        print("📊 Starting data extraction...")
        
        # Extract base assessment data
        df_assessments = self.extract_student_assessment_data()
        
        if df_assessments.empty:
            print("✗ No assessment data found")
            return None, None
        
        print(f"✓ Extracted {len(df_assessments)} assessment records")
        
        # Calculate trend features
        df_trends = self.calculate_trend_features(df_assessments)
        print(f"✓ Calculated trends for {len(df_trends)} unique students")
        
        # Merge trend features
        df_final = df_assessments.merge(df_trends, on='user_id', how='left')
        
        # Handle missing values
        df_final = df_final.fillna({
            'dass21_score': 0,
            'phq9_score': 0,
            'gad7_score': 0,
            'mood_slope': 0,
            'energy_slope': 0,
            'esm_entries_7d': 0,
            'dass_trend': 0,
            'phq_trend': 0,
            'gad_trend': 0,
            'year_level': 2,
        })
        
        # Encode categorical variables
        df_final['sex_encoded'] = df_final['sex'].map({'M': 1, 'F': 0, None: -1}).fillna(-1)
        df_final['trajectory_numeric'] = df_final['trajectory'].map({
            'Stable': 0,
            'Deteriorating': 1,
            'At-Risk': 2,
            'Insufficient Data': -1
        }).fillna(-1)
        
        # Map target variable: risk_level to binary classification
        # 0 = Low/Moderate, 1 = High/Crisis (needs intervention)
        df_final['target'] = (df_final['risk_level'].isin(['High', 'Crisis'])).astype(int)
        
        # Select features for modeling
        feature_columns = [
            'dass21_score', 'phq9_score', 'gad7_score',
            'mood_slope', 'energy_slope',
            'esm_entries_7d', 'year_level', 'sex_encoded',
            'dass_trend', 'phq_trend', 'gad_trend',
            'at_risk_percentage', 'high_risk_frequency',
            'days_since_last', 'assessment_count',
            'total_appointments', 'completed_appointments',
            'trajectory_numeric'
        ]
        
        X = df_final[feature_columns].copy()
        y = df_final['target'].copy()
        
        print(f"\n📈 Dataset Statistics:")
        print(f"  Total records: {len(X)}")
        print(f"  Features: {len(feature_columns)}")
        print(f"  Target distribution: {y.value_counts().to_dict()}")
        print(f"  Class balance: {y.value_counts(normalize=True).to_dict()}")
        
        return X, y, feature_columns, df_final

    def get_latest_student_assessment(self, user_id):
        """
        Get the latest assessment record for a specific student
        Used during real-time prediction
        """
        query = """
        SELECT 
            rc.dass21_score,
            rc.phq9_score,
            rc.gad7_score,
            rc.mood_slope,
            rc.energy_slope,
            rc.trajectory,
            rc.risk_level,
            u.year_level,
            u.sex,
            (SELECT COUNT(*) FROM esm_checkins 
             WHERE user_id = rc.user_id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as esm_entries_7d,
            (SELECT COUNT(*) FROM appointments WHERE user_id = rc.user_id) as total_appointments,
            (SELECT COUNT(*) FROM appointments WHERE user_id = rc.user_id AND status = 'completed') as completed_appointments
        FROM risk_classifications rc
        INNER JOIN users u ON rc.user_id = u.id
        WHERE rc.user_id = %s
        ORDER BY rc.created_at DESC
        LIMIT 1
        """
        
        cursor = self.conn.cursor(dictionary=True)
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        cursor.close()
        
        return result if result else None
