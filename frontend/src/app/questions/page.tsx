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
  exam: string[];
  subject: string[];
  unit: string[];
  topic: string[];
  subtopic: string[];
  difficulty: string[];
  type: string[];
};

type QuestionsResponse = {
  questions: Question[];
  filters: FilterOptions;
};

export default function QuestionsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>({
    exam: [],
    subject: [],
    unit: [],
    topic: [],
    subtopic: [],
    difficulty: [],
    type: []
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Ensure questions is always an array
  const safeQuestions = Array.isArray(questions) ? questions : [];
  // Ensure filterOptions properties are always arrays
  const safeFilterOptions = {
    exam: Array.isArray(filterOptions.exam) ? filterOptions.exam : [],
    subject: Array.isArray(filterOptions.subject) ? filterOptions.subject : [],
    unit: Array.isArray(filterOptions.unit) ? filterOptions.unit : [],
    topic: Array.isArray(filterOptions.topic) ? filterOptions.topic : [],
    subtopic: Array.isArray(filterOptions.subtopic) ? filterOptions.subtopic : [],
    difficulty: Array.isArray(filterOptions.difficulty) ? filterOptions.difficulty : [],
    type: Array.isArray(filterOptions.type) ? filterOptions.type : [],
  };

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

  // Fetch questions and filters from the enhanced /api/questions endpoint
  const fetchQuestionsAndFilters = React.useCallback(async () => {
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
      
      const res = await api.get<QuestionsResponse>('/api/questions', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Questions API Response:', res.data);
      
      // Handle both old and new API structures
      let questionsData: Question[] = [];
      let filtersData: FilterOptions = {
        exam: [],
        subject: [],
        unit: [],
        topic: [],
        subtopic: [],
        difficulty: [],
        type: []
      };
      
      if (Array.isArray(res.data)) {
        // Old API structure: returns array directly
        questionsData = res.data;
        console.log('Using old API structure (array)');
        
        // Extract unique filter values from questions
        const extractUniqueValues = (field: keyof Question) => {
          return [...new Set(questionsData
            .map(q => q[field])
            .filter(value => value && value !== null && value !== '')
            .map(value => String(value))
          )].sort();
        };
        
        filtersData = {
          exam: extractUniqueValues('exam'),
          subject: extractUniqueValues('subject'),
          unit: extractUniqueValues('unit'),
          topic: extractUniqueValues('topic'),
          subtopic: extractUniqueValues('subtopic'),
          difficulty: extractUniqueValues('difficulty'),
          type: extractUniqueValues('type')
        };
      } else if (res.data && typeof res.data === 'object') {
        // New API structure: returns {questions: [...], filters: {...}}
        questionsData = res.data.questions || [];
        filtersData = res.data.filters || filtersData;
        console.log('Using new API structure (object)');
      }
      
      console.log('Processed questions:', questionsData.length);
      console.log('Processed filters:', filtersData);
      
      // Update questions from the response
      setQuestions(questionsData);
      
      // Update filter options from the response
      setFilterOptions(filtersData);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to fetch questions and filters';
      setError(msg);
      setQuestions([]); // Ensure questions is always an array
      // Keep existing filter options on error
    } finally {
      setLoading(false);
    }
  }, [token, subject, difficulty, qtype, exam, unit, topic, subtopic]);

  React.useEffect(() => {
    fetchQuestionsAndFilters();
  }, [fetchQuestionsAndFilters]);

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

      {/* Production Debug Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-sm">
        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Filter Options Available:</div>
        <div className="text-blue-700 dark:text-blue-300 space-x-4">
          <span>Exam: {safeFilterOptions.exam.length}</span>
          <span>Subject: {safeFilterOptions.subject.length}</span>
          <span>Unit: {safeFilterOptions.unit.length}</span>
          <span>Topic: {safeFilterOptions.topic.length}</span>
          <span>Subtopic: {safeFilterOptions.subtopic.length}</span>
          <span>Difficulty: {safeFilterOptions.difficulty.length}</span>
        </div>
        {(safeFilterOptions.exam.length === 0 && safeFilterOptions.unit.length === 0 && 
          safeFilterOptions.topic.length === 0 && safeFilterOptions.subtopic.length === 0) && (
          <div className="text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ Limited filter options detected - this indicates production database needs enhanced question data.
          </div>
        )}
      </div>

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
            {Array.isArray(safeFilterOptions.exam) && safeFilterOptions.exam.map((e: string) => (
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
            {Array.isArray(safeFilterOptions.subject) && safeFilterOptions.subject.map((s: string) => (
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
            {Array.isArray(safeFilterOptions.unit) && safeFilterOptions.unit.map((u: string) => (
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
            {Array.isArray(safeFilterOptions.topic) && safeFilterOptions.topic.map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sub-topic</label>
          <select
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            value={subtopic}
            onChange={(e) => setSubtopic(e.target.value)}
          >
            <option value="">All</option>
            {Array.isArray(safeFilterOptions.subtopic) && safeFilterOptions.subtopic.map((st: string) => (
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
            {Array.isArray(safeFilterOptions.difficulty) && safeFilterOptions.difficulty.map((d: string) => (
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
            {Array.isArray(safeFilterOptions.type) && safeFilterOptions.type?.map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-6 flex gap-2">
        <button
          onClick={fetchQuestionsAndFilters}
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
      ) : !Array.isArray(safeQuestions) || safeQuestions.length === 0 ? (
        <div>No questions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeQuestions.map((q) => (
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
                {Array.isArray(q.options) && q.options?.map((opt) => (
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
