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
  exam?: string | null;
  unit?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  options: Option[];
};

type FilterOptions = {
  exams: string[];
  subjects: string[];
  units: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  types?: string[]; // Add types to the filter options
};

export default function QuestionsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>({
    exams: [],
    subjects: [],
    units: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    types: []
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [subject, setSubject] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('');
  const [qtype, setQtype] = React.useState('');
  const [exam, setExam] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [subtopic, setSubtopic] = React.useState('');

  // Remove the derived dropdown values - we'll use API data instead
  React.useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [token, router]);

  // Fetch filter options from the new /api/filters endpoint
  const fetchFilterOptions = React.useCallback(async () => {
    try {
      // Use the new /api/filters endpoint without authentication since it's public data
      const res = await api.get<FilterOptions>('/api/filters');
      setFilterOptions({
        exams: res.data?.exams || [],
        subjects: res.data?.subjects || [],
        units: res.data?.units || [],
        topics: res.data?.topics || [],
        subtopics: res.data?.subtopics || [],
        difficulties: res.data?.difficulties || [],
        types: res.data?.types || ['multiple-choice', 'true-false', 'short-answer'] // Default types if not in API
      });
    } catch (err: any) {
      console.error('Failed to fetch filter options:', err);
      // Set some default options if API fails
      setFilterOptions({
        exams: [],
        subjects: [],
        units: [],
        topics: [],
        subtopics: [],
        difficulties: ['Easy', 'Medium', 'Hard'],
        types: ['multiple-choice', 'true-false', 'short-answer']
      });
    }
  }, []); // Remove token dependency since this endpoint is public

  const fetchQuestions = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (subject) params.subject = subject;
      if (difficulty) params.difficulty = difficulty;
      if (qtype) params.type = qtype;
      if (exam) params.exam = exam;
      if (unit) params.unit = unit;
      if (topic) params.topic = topic;
      if (subtopic) params.subtopic = subtopic;
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
  }, [token, subject, difficulty, qtype, exam, unit, topic, subtopic]);

  React.useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  React.useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function clearFilters() {
    setSubject('');
    setDifficulty('');
    setQtype('');
    setExam('');
    setUnit('');
    setTopic('');
    setSubtopic('');
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Questions</h1>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Exam</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.exams.map((e: string) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.subjects.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.units.map((u: string) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.topics.map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtopic</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={subtopic}
            onChange={(e) => setSubtopic(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.subtopics.map((st: string) => (
              <option key={st} value={st}>{st}</option>
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
            {filterOptions.difficulties.map((d: string) => (
              <option key={d} value={d}>{d}</option>
            ))}
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
            {filterOptions.types?.map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-6 flex gap-2">
        <button
          onClick={fetchQuestions}
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={() => { clearFilters(); }}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2"
        >
          Clear All
        </button>
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
                  {(q.exam || q.subject || q.unit || q.topic || q.subtopic || q.difficulty || q.type) && (
                    <div className="space-y-1">
                      {q.exam && <div><span className="font-medium">Exam:</span> {q.exam}</div>}
                      {q.subject && <div><span className="font-medium">Subject:</span> {q.subject}</div>}
                      {q.unit && <div><span className="font-medium">Unit:</span> {q.unit}</div>}
                      {q.topic && <div><span className="font-medium">Topic:</span> {q.topic}</div>}
                      {q.subtopic && <div><span className="font-medium">Subtopic:</span> {q.subtopic}</div>}
                      <div>
                        {[q.difficulty, q.type].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-white mt-2">{q.text}</h2>
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
