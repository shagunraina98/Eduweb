"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

type Option = {
  id: number;
  label: string;
  option_text: string;
  is_correct?: number | boolean;
};

type Question = {
  id: number;
  text: string;
  subject?: string | null;
  difficulty?: string | null;
  type?: string | null;
  options: Option[];
};

export default function QuestionsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [subject, setSubject] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('');
  const [qtype, setQtype] = React.useState('');

  // Derived dropdown values from loaded questions
  const subjects = React.useMemo(() => {
    const s = new Set<string>();
    questions.forEach(q => { if (q.subject) s.add(String(q.subject)); });
    return Array.from(s).sort();
  }, [questions]);

  const types = React.useMemo(() => {
    const t = new Set<string>();
    questions.forEach(q => { if (q.type) t.add(String(q.type)); });
    return Array.from(t).sort();
  }, [questions]);

  React.useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [token, router]);

  const fetchQuestions = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (subject) params.subject = subject;
      if (difficulty) params.difficulty = difficulty;
      if (qtype) params.type = qtype;
      const res = await api.get<Question[]>('/api/questions', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(res.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to fetch questions';
      setError(msg);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [token, subject, difficulty, qtype]);

  React.useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function clearFilters() {
    setSubject('');
    setDifficulty('');
    setQtype('');
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Questions</h1>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">All</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={qtype}
            onChange={(e) => setQtype(e.target.value)}
          >
            <option value="">All</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={fetchQuestions}
            className="flex-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium"
          >
            Apply
          </button>
          <button
            onClick={() => { clearFilters(); }}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : questions.length === 0 ? (
        <div>No questions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-gray-800 rounded-lg shadow p-4">
              <div className="mb-2">
                <div className="text-sm text-neutral-400">
                  {(q.subject || q.difficulty || q.type) && (
                    <span>
                      {[q.subject, q.difficulty, q.type].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-white mt-1">{q.text}</h2>
              </div>
              <div className="mt-3">
                {q.options?.map((opt) => (
                  <div key={opt.id} className="mt-1 text-white text-sm">
                    <span className="font-medium mr-1">{opt.label}.</span>
                    {opt.option_text}
                  </div>
                ))}
                {(() => {
                  const correct = q.options?.find(o => !!o.is_correct);
                  return correct ? (
                    <div className="text-green-400 font-semibold mt-2">
                      Correct Answer: {correct.option_text}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
