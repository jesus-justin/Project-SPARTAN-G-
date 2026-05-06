import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitDass21 } from '../api/assessment.api';

const QUESTIONS = [
  'I found it hard to wind down.',
  'I was aware of dryness of my mouth.',
  'I could not seem to experience any positive feeling at all.',
  'I experienced breathing difficulty.',
  'I found it difficult to work up the initiative to do things.',
  'I tended to over-react to situations.',
  'I experienced trembling.',
  'I felt that I was using a lot of nervous energy.',
  'I was worried about situations in which I might panic.',
  'I felt that I had nothing to look forward to.',
  'I found myself getting agitated.',
  'I found it difficult to relax.',
  'I felt down-hearted and blue.',
  'I was intolerant of anything that kept me from getting on.',
  'I felt I was close to panic.',
  'I was unable to become enthusiastic about anything.',
  'I felt I was not worth much as a person.',
  'I felt that I was rather touchy.',
  'I was aware of the action of my heart in the absence of exertion.',
  'I felt scared without any good reason.',
  'I felt that life was meaningless.',
];

export default function Dass21Page() {
  const [answers, setAnswers] = useState(Array(21).fill(null));
  const [page, setPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const pageSize = 7;
  const pageItems = useMemo(() => QUESTIONS.slice(page * pageSize, page * pageSize + pageSize), [page]);
  const totalPages = Math.ceil(QUESTIONS.length / pageSize);
  const answeredCount = answers.filter((a) => a !== null).length;

  const setAnswer = (absoluteIndex, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[absoluteIndex] = value;
      return next;
    });
  };

  const submit = async () => {
    if (answers.some((x) => x === null)) {
      setError('Please answer all 21 items before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitDass21(answers);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit DASS-21');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '24px auto', padding: 16 }}>
      <h2>DASS-21 Assessment</h2>
      <div style={{ height: 10, background: '#f1f1f1', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ width: `${(answeredCount / 21) * 100}%`, height: '100%', background: '#CC0000' }} />
      </div>
      <p style={{ marginTop: 0 }}>Progress: {answeredCount}/21 answered</p>

      {pageItems.map((q, idx) => {
        const absoluteIndex = page * pageSize + idx;
        return (
          <div key={absoluteIndex} style={{ border: '1px solid #ececec', borderRadius: 10, padding: 12, marginBottom: 10, background: '#fff' }}>
            <p style={{ marginTop: 0, fontWeight: 600 }}>{absoluteIndex + 1}. {q}</p>
            <div style={{ display: 'grid', gap: 6 }}>
              {[0, 1, 2, 3].map((score) => (
                <label key={score}>
                  <input
                    type="radio"
                    name={`q-${absoluteIndex}`}
                    checked={answers[absoluteIndex] === score}
                    onChange={() => setAnswer(absoluteIndex, score)}
                  />{' '}
                  {score}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button disabled={page === totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next</button>
      </div>

      {error && <p style={{ color: '#D32F2F' }}>{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        style={{ marginTop: 14, background: '#CC0000', color: '#fff', border: 0, borderRadius: 8, padding: '10px 14px' }}
      >
        {submitting ? 'Submitting...' : 'Submit DASS-21'}
      </button>
    </div>
  );
}
