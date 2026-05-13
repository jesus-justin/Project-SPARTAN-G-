import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPhq9, getPhq9Questions } from '../api/assessment.api';
import RiskBadge from '../components/RiskBadge';
import CrisisAlert from '../components/CrisisAlert';

export default function Phq9Page() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const options = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];

  useEffect(() => {
    async function load() {
      try {
        const res = await getPhq9Questions();
        if (res?.data) {
          setQuestions(res.data);
          setAnswers(Array(res.data.length).fill(null));
        }
      } catch (err) {
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!result) {
      return undefined;
    }

    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [result, navigate]);

  const handleAnswer = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitPhq9(answers);
      if (res?.data) {
        setResult({
          severity: res.data.scoring?.severity || 'Unknown',
          totalScore: res.data.scoring?.totalScore || 0,
          riskLevel: res.data.riskLevel || 'Unknown',
          trajectory: res.data.trajectory || 'Stable',
        });
      }
    } catch (err) {
      setError('Failed to submit: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>Loading...</div>;
  }

  if (result) {
    return (
      <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#CC0000',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Back to Dashboard
        </button>
        <h2 style={{ marginBottom: 20 }}>PHQ-9 Results</h2>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd' }}>
          <div style={{ marginBottom: 20 }}>
            <p>
              <strong>Severity:</strong> {result.severity}
            </p>
            <p>
              <strong>Total Score:</strong> {result.totalScore}
            </p>
            <p>
              <strong>Risk Level:</strong>
            </p>
            <RiskBadge level={result.riskLevel} />
          </div>

          {result.riskLevel === 'Crisis' && <CrisisAlert />}

          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: '#2e7d32' }}>Redirecting to dashboard...</span>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: '8px 12px' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>No questions available</div>;
  }

  const currentQuestion = questions[currentIndex] || {};
  const currentAnswer = answers[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: 16 }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none',
          border: 'none',
          color: '#CC0000',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ← Back to Dashboard
      </button>
      <h2>PHQ-9 Depression Screening</h2>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Question {currentIndex + 1} of 9</span>
            <span style={{ color: '#999' }}>Answered: {answeredCount} / 9</span>
          </div>
          <div style={{ background: '#e8e8e8', borderRadius: 4, overflow: 'hidden', height: 8 }}>
            <div
              style={{
                background: '#d32f2f',
                width: `${progress}%`,
                height: '100%',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <h3 style={{ marginBottom: 20, color: '#333', fontSize: 18 }}>{currentQuestion.text}</h3>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          {options.map((option, index) => (
            <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12 }}>
              <input
                type="radio"
                name="answer"
                value={index}
                checked={currentAnswer === index}
                onChange={() => handleAnswer(currentIndex, index)}
                style={{ cursor: 'pointer' }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d32f2f',
              color: '#d32f2f',
              background: '#fff',
              borderRadius: 6,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: currentIndex === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={currentAnswer === null}
              style={{
                flex: 1,
                padding: '12px',
                background: '#d32f2f',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: currentAnswer === null ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: currentAnswer === null ? 0.5 : 1,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={currentAnswer === null || submitting}
              style={{
                flex: 1,
                padding: '12px',
                background: '#d32f2f',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: currentAnswer === null || submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: currentAnswer === null || submitting ? 0.5 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 6 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
