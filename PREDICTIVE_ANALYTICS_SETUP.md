# Predictive Analytics Implementation Guide

## Overview

This guide covers the complete setup and integration of the predictive analytics system for the SPARTAN-G OGC Facilitator Portal.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              OGC Facilitator Dashboard (React)              │
│  • PredictiveRiskCard - Real-time risk predictions         │
│  • StudentPredictionTab - Detailed SHAP explanations       │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP API Calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend API (Node.js Express)                     │
│  • GET /api/predictions/student/{userId}                   │
│  • POST /api/predictions/batch                             │
│  • GET /api/predictions/explain/{userId}                   │
│  • GET /api/predictions/history/{userId}                   │
│  • POST /api/predictions/train (admin)                     │
│  • GET /api/predictions/health                             │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP API Calls (via axios)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│        ML Service (Python Flask)                            │
│  • XGBoost primary model                                   │
│  • Logistic Regression baseline                            │
│  • SHAP explainability                                     │
│  • Model training & inference                              │
└────────────────┬────────────────────────────────────────────┘
                 │ Database queries
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           MySQL Database                                    │
│  • risk_classifications (predictions + SHAP drivers)       │
│  • dass21_assessments, phq9_responses, gad7_responses      │
│  • esm_checkins (mood/energy trends)                       │
│  • users (student demographics)                            │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Phase 1: Environment Setup

#### 1.1 Create `.env` files

**Backend** (`backend/.env`):
```env
# Existing backend configuration
NODE_ENV=production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=spartan_db

# Add ML Service URL
ML_SERVICE_URL=http://localhost:5000
```

**ML Service** (`ml-service/.env`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=spartan_db

FLASK_ENV=development
FLASK_DEBUG=false

ML_MODEL_DIR=models
```

#### 1.2 Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**ML Service:**
```bash
cd ml-service
python -m venv venv
source venv/Scripts/activate  # Windows
# or
source venv/bin/activate       # Linux/Mac

pip install -r requirements.txt
```

### Phase 2: Train Models

```bash
cd ml-service
python train.py
```

This will:
1. Connect to MySQL database
2. Extract assessment history from last 90 days
3. Engineer features from assessment data
4. Train Logistic Regression baseline
5. Train XGBoost primary model
6. Generate SHAP explainer
7. Save models to `ml-service/models/`

**Output:**
```
========================================================
MENTAL HEALTH PREDICTIVE ANALYTICS - MODEL TRAINING
========================================================

📊 Database Configuration:
  Host: localhost
  Database: spartan_db

🔗 Connecting to database...
✓ Database connected

📈 Preparing training data...
✓ Extracted 450 assessment records
✓ Calculated trends for 142 unique students
✓ Dataset Statistics:
  Total records: 450
  Features: 17
  Target distribution: {0: 287, 1: 163}
  Class balance: {0: 0.638, 1: 0.362}

🤖 Training Predictive Models...
✓ Train/Test split: 360/90

📊 Training Logistic Regression (Baseline)...
  ✓ Cross-validation AUC: 0.8234 (+/- 0.0456)
  ✓ Test ROC-AUC: 0.8145
  ✓ Test F1-Score: 0.7623
  ✓ Test Precision: 0.7890
  ✓ Test Recall: 0.7412

🚀 Training XGBoost (Primary Model)...
  ✓ Test ROC-AUC: 0.8923
  ✓ Test F1-Score: 0.8234
  ✓ Test Precision: 0.8456
  ✓ Test Recall: 0.8012
  ✓ Boosting rounds: 287

🔍 Generating SHAP Explainer...
  ✓ TreeExplainer ready for real-time explanations

📌 Top 5 Most Important Features (by usage):
  phq9_score: 45
  dass21_score: 38
  mood_slope: 32
  gad7_score: 28
  at_risk_percentage: 21

✅ TRAINING COMPLETE
...
```

### Phase 3: Start Services

#### 3.1 Start ML Service (Terminal 1)
```bash
cd ml-service
python app.py
```

**Expected Output:**
```
 * Running on http://0.0.0.0:5000
 * Debug mode: off
```

#### 3.2 Start Backend (Terminal 2)
```bash
cd backend
npm start
```

#### 3.3 Start OGC Dashboard (Terminal 3)
```bash
cd ogc-dashboard
npm run dev
```

### Phase 4: Integrate Dashboard Components

#### 4.1 Update Student Detail Page

In `ogc-dashboard/src/pages/StudentDetailPage.jsx`:

```jsx
import PredictiveRiskCard from '../components/PredictiveRiskCard';
import StudentPredictionTab from '../components/StudentPredictionTab';

export function StudentDetailPage() {
  const { studentId } = useParams();
  
  return (
    <div className="student-detail">
      <h1>Student Details</h1>
      
      {/* Add predictive risk card */}
      <PredictiveRiskCard studentId={studentId} />
      
      {/* Add tabs */}
      <div className="tabs">
        <div className="tab-content">
          <StudentPredictionTab studentId={studentId} studentName={studentName} />
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 Update Dashboard Population Overview

In `ogc-dashboard/src/components/PopulationOverview.jsx`:

```jsx
// Add predicted risk column to student list
const columns = [
  { key: 'student_id', label: 'Student ID' },
  { key: 'name', label: 'Name' },
  { key: 'current_risk', label: 'Current Risk (Rule-Based)' },
  { key: 'predicted_risk', label: 'Predicted Risk (ML)' },  // NEW
  { key: 'action', label: 'Action' },
];

// Fetch predictions in batch
const fetchPredictionsForStudents = async (userIds) => {
  const response = await fetch('/api/predictions/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userIds })
  });
  return response.json();
};
```

## API Endpoints

### Health Check
```http
GET /api/predictions/health
```

**Response:**
```json
{
  "success": true,
  "service": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00"
  },
  "models": {
    "lr_model": true,
    "xgb_model": true,
    "features_count": 17
  }
}
```

### Single Prediction
```http
GET /api/predictions/student/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "student": {
    "id": 42,
    "student_id": "2021-0001",
    "name": "Juan dela Cruz"
  },
  "prediction": {
    "prediction_probability": 0.78,
    "predicted_risk_level": "High",
    "recommendation": "Close monitoring and follow-up recommended",
    "shap_drivers": [
      {
        "feature": "phq9_score",
        "shap_value": 0.32,
        "feature_value": 18,
        "contribution": "increases"
      }
    ],
    "model": "XGBoost with SHAP"
  },
  "currentRuleBasedRisk": "Moderate",
  "timestamp": "2024-01-15T10:35:22"
}
```

### Batch Predictions
```http
POST /api/predictions/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "userIds": [1, 2, 3, 42]
}
```

### Prediction Explanation
```http
GET /api/predictions/explain/{userId}
Authorization: Bearer {token}
```

### Prediction History
```http
GET /api/predictions/history/{userId}?limit=10
Authorization: Bearer {token}
```

### Train Models
```http
POST /api/predictions/train
Authorization: Bearer {token}
# Admin only
```

## Dashboard Components Usage

### PredictiveRiskCard
```jsx
import PredictiveRiskCard from './components/PredictiveRiskCard';

<PredictiveRiskCard 
  studentId={42}
  onRefresh={() => console.log('Refreshed')}
/>
```

**Features:**
- Real-time prediction display
- Confidence indicator
- SHAP drivers with collapsible view
- Risk-level color coding
- Auto-refresh button

### StudentPredictionTab
```jsx
import StudentPredictionTab from './components/StudentPredictionTab';

<StudentPredictionTab 
  studentId={42}
  studentName="Juan dela Cruz"
/>
```

**Features:**
- Detailed interpretation
- Assessment scores display
- Top SHAP contributing factors
- Prediction history timeline
- Metadata and model info
- Disclaimer for responsible use

## Testing

### 1. Test ML Service Directly

```bash
# Health check
curl http://localhost:5000/health

# Get model status
curl http://localhost:5000/api/models/status

# Train models
curl -X POST http://localhost:5000/api/train

# Predict for student
curl http://localhost:5000/api/predict/student/42
```

### 2. Test Backend Integration

```bash
# Get prediction
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/predictions/student/42

# Get batch predictions
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userIds":[1,2,3,42]}' \
  http://localhost:3001/api/predictions/batch
```

### 3. Test Dashboard Components

1. Navigate to student detail page
2. Verify PredictiveRiskCard displays prediction
3. Check SHAP drivers are correctly formatted
4. Test StudentPredictionTab for detailed explanation
5. Verify history timeline loads

## Troubleshooting

### ML Service Won't Connect

**Error:**
```
✗ Database connection error: Access denied for user 'root'
```

**Solution:**
- Check MySQL is running
- Verify credentials in `.env`
- Check database exists: `spartan_db`

### Models Not Training

**Error:**
```
✗ No training data available
```

**Solution:**
- Run assessment submissions first
- Check risk_classifications table has records
- Verify students have completed DASS-21, PHQ-9, GAD-7

### Predictions Not Displaying

**Check:**
1. ML service running: `http://localhost:5000/health`
2. Backend can reach ML service
3. Backend logs for errors
4. Student has completed assessments

### SHAP Values Missing

**Check:**
1. Models trained successfully
2. Explainer initialized in predictor.py
3. Feature names match between training and inference

## Production Deployment

### Docker Setup

**`ml-service/Dockerfile`:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

**Run:**
```bash
docker build -t spartan-ml-service .
docker run -p 5000:5000 --env-file .env spartan-ml-service
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spartan-ml-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-service
  template:
    metadata:
      labels:
        app: ml-service
    spec:
      containers:
      - name: ml-service
        image: spartan-ml-service:latest
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ml-config
              key: db_host
```

## Monitoring & Maintenance

### Model Retraining Schedule

Recommended: **Weekly (Sundays, 2 AM)**

```bash
# Cron job (Linux/Mac)
0 2 * * 0 cd /path/to/ml-service && python train.py

# Windows Task Scheduler
# Task: Run train.py weekly at 2 AM
```

### Performance Monitoring

Track:
- Model AUC score over time
- Prediction latency
- Database query performance
- Service uptime

### Model Versioning

Save model versions:
```bash
cp models/xgb_model.json models/xgb_model_v1_2024_01_15.json
cp models/training_report.txt models/report_v1_2024_01_15.txt
```

## Security Considerations

1. **ML Service Authentication:**
   - Run behind API gateway
   - Require API keys for /api/train endpoint
   - Use firewall rules (internal network only)

2. **Data Privacy:**
   - ML service doesn't log student names/IDs
   - SHAP drivers are relative feature importance
   - Encrypted connections between services

3. **Model Security:**
   - Store models in secure location
   - Version control models
   - Regular security audits

## References

1. Hosmer, D. W., Lemeshow, S., & Sturdivant, R. X. (2013). Applied logistic regression (3rd ed.). John Wiley & Sons.

2. Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. In Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (pp. 785-794).

3. Shatte, A. B., Hutchinson, D. M., & Teague, S. J. (2019). Machine learning approaches for clinical psychology and psychiatry. Annual Review of Clinical Psychology, 15, 201-224.

4. Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting model predictions. In Advances in neural information processing systems (pp. 4765-4774).

## Support

For issues or questions:
1. Check logs in `ml-service/models/training_report.txt`
2. Review backend error logs
3. Verify database connectivity
4. Check model status endpoint

## Version History

- **v1.0** (2024-01-15): Initial release
  - XGBoost + Logistic Regression
  - SHAP explainability
  - Dashboard integration

---

**Last Updated:** 2024-01-15
**Status:** Production Ready ✅
