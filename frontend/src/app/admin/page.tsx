"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

type OptionForm = { id?: number; label: string; option_text: string; is_correct: boolean };
type QuestionItem = {
  id: number;
  text: string;
  subject?: string | null;
  difficulty?: string | null;
  type?: string | null;
  exam?: string | null;
  unit?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  options: Array<{ id: number; label: string; option_text: string; is_correct: boolean }>;
};

export default function AdminPage() {
  const router = useRouter();
  const { token, role } = useAuth();

  const [items, setItems] = React.useState<QuestionItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [text, setText] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [difficulty, setDifficulty] = React.useState('easy');
  const [qtype, setQtype] = React.useState('mcq');
  const [exam, setExam] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [subtopic, setSubtopic] = React.useState('');
  const [options, setOptions] = React.useState<OptionForm[]>([
    { label: 'A', option_text: '', is_correct: false },
    { label: 'B', option_text: '', is_correct: false },
    { label: 'C', option_text: '', is_correct: false },
    { label: 'D', option_text: '', is_correct: false },
  ]);

  React.useEffect(() => {
    if (!token || role !== 'admin') {
      router.replace('/login');
    }
  }, [token, role, router]);

  const fetchAll = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<QuestionItem[]>('/api/questions');
      setItems(res.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to load questions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function resetForm() {
    setEditingId(null);
    setText('');
    setSubject('');
    setDifficulty('easy');
    setQtype('mcq');
    setExam('');
    setUnit('');
    setTopic('');
    setSubtopic('');
    setOptions([
      { label: 'A', option_text: '', is_correct: false },
      { label: 'B', option_text: '', is_correct: false },
      { label: 'C', option_text: '', is_correct: false },
      { label: 'D', option_text: '', is_correct: false },
    ]);
  }

  function loadForEdit(q: QuestionItem) {
    setEditingId(q.id);
    setText(q.text || '');
    setSubject((q.subject as string) || '');
    setDifficulty((q.difficulty as string) || 'easy');
    setQtype((q.type as string) || 'mcq');
    setExam((q.exam as string) || '');
    setUnit((q.unit as string) || '');
    setTopic((q.topic as string) || '');
    setSubtopic((q.subtopic as string) || '');
    setOptions(
      (q.options || []).map(o => ({ id: o.id, label: o.label, option_text: o.option_text, is_correct: !!o.is_correct }))
    );
    
    // Scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      // Normalize and validate values
      const normalizedText = text.trim();
      const normalizedSubject = subject.trim();
      const normalizedDifficulty = String(difficulty).trim();
      const normalizedType = String(qtype).trim();
      const normalizedExam = exam.trim();
      const normalizedUnit = unit.trim();
      const normalizedTopic = topic.trim();
      const normalizedSubtopic = subtopic.trim();

      // Ensure options array matches backend requirements
      const normalizedOptions = options
        .map((o, idx) => {
          const label = (o.label?.trim() || String.fromCharCode('A'.charCodeAt(0) + idx)).toUpperCase();
          const option_text = (o.option_text || '').trim();
          const is_correct = !!o.is_correct;
          return { label, option_text, is_correct };
        })
        // Filter out any accidentally empty entries
        .filter(o => o.label.length > 0 && o.option_text.length > 0);

      if (!normalizedText || !normalizedSubject || !normalizedDifficulty || !normalizedType) {
        setError('Please fill in question text, subject, difficulty, and type.');
        return;
      }
      if (normalizedOptions.length === 0) {
        setError('Please provide at least one option with text.');
        return;
      }

      const payload = {
        text: normalizedText,
        subject: normalizedSubject,
        difficulty: normalizedDifficulty,
        type: normalizedType,
        exam: normalizedExam,
        unit: normalizedUnit,
        topic: normalizedTopic,
        subtopic: normalizedSubtopic,
        options: normalizedOptions,
      };

      console.log('Admin form submission:', { editingId, payload, options });

      if (editingId) {
        // Update question with all fields including options
        const updatePayload = {
          text: payload.text,
          subject: payload.subject,
          difficulty: payload.difficulty,
          type: payload.type,
          exam: payload.exam,
          unit: payload.unit,
          topic: payload.topic,
          subtopic: payload.subtopic,
          options: options.map(o => ({
            id: o.id, // Include existing ID if available
            label: o.label,
            option_text: o.option_text,
            is_correct: o.is_correct
          }))
        };
        console.log('Sending PUT request with payload:', updatePayload);
        const response = await api.put(`/api/questions/${editingId}`, updatePayload, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('PUT response:', response.data);
      } else {
        console.log('Sending POST request with payload:', payload);
        const response = await api.post('/api/questions', payload, { headers: { Authorization: `Bearer ${token}` } });
        console.log('POST response:', response.data);
      }
      await fetchAll();
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to save question';
      console.error('Admin form error:', err);
      setError(msg);
    }
  }

  async function onDelete(id: number) {
    if (!token) return;
    const ok = window.confirm('Delete this question?');
    if (!ok) return;
    try {
      await api.delete(`/api/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAll();
      if (editingId === id) resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to delete question';
      setError(msg);
    }
  }

  function updateOption(idx: number, patch: Partial<OptionForm>) {
    setOptions(prev => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  function addOption() {
    const nextLabel = String.fromCharCode('A'.charCodeAt(0) + options.length);
    setOptions(prev => [...prev, { label: nextLabel, option_text: '', is_correct: false }]);
  }

  function removeOption(idx: number) {
    setOptions(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      {/* Create / Edit form */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
        <h2 className="text-lg font-medium mb-3">{editingId ? 'Edit Question' : 'Create Question'}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question Text</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Math"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <input
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={qtype}
                onChange={(e) => setQtype(e.target.value)}
                placeholder="e.g. mcq"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Exam</label>
              <input
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                placeholder="e.g. JEE, NEET, SAT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Unit 1, Chapter 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topic</label>
              <input
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Algebra, Physics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sub-topic</label>
              <input
                className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-3 py-2"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder="e.g. Linear Equations"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Options</label>
              <button type="button" onClick={addOption} className="rounded-md border px-3 py-1 text-sm">Add</button>
            </div>
            <div className="space-y-2">
              {options.map((o, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={o.label}
                      onChange={(e) => updateOption(idx, { label: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-2 py-1"
                      placeholder="A"
                    />
                  </div>
                  <div className="col-span-9">
                    <input
                      type="text"
                      value={o.option_text}
                      onChange={(e) => updateOption(idx, { option_text: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white text-gray-900 px-2 py-1"
                      placeholder="Option text"
                      required
                    />
                  </div>
                  <div className="col-span-1 flex items-center gap-2">
                    <input
                      id={`correct-${idx}`}
                      type="checkbox"
                      checked={o.is_correct}
                      onChange={(e) => updateOption(idx, { is_correct: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`correct-${idx}`} className="text-sm">Correct</label>
                  </div>
                  <div className="col-span-1 text-right">
                    <button type="button" onClick={() => removeOption(idx)} className="text-sm text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-md border px-4 py-2">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div>Loading…</div>
        ) : items.length === 0 ? (
          <div>No questions found.</div>
        ) : (
          items.map(q => (
            <div key={q.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-neutral-500">
                    {[q.subject, q.difficulty, q.type].filter(Boolean).join(' • ')}
                  </div>
                  <h3 className="text-lg font-medium mt-1">{q.text}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-blue-600" onClick={() => loadForEdit(q)}>Edit</button>
                  <button className="text-sm text-red-600" onClick={() => onDelete(q.id)}>Delete</button>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {q.options?.map(o => (
                  <li key={o.id} className="flex items-start gap-2">
                    <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs border ${o.is_correct ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}>
                      {o.label}
                    </span>
                    <span>{o.option_text}</span>
                    {o.is_correct && <span className="text-green-600 text-xs ml-2">(correct)</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
