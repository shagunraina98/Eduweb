"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLoginRedirect } from '@/lib/useLoginRedirect';
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
  const { loginUrl } = useLoginRedirect();

  const [items, setItems] = React.useState<QuestionItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'manage' | 'bulk'>('manage');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [previewRows, setPreviewRows] = React.useState<any[]>([]);
  const [parsing, setParsing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Minimal toast system (local to this page)
  type Toast = { id: number; type: 'success' | 'warning' | 'error'; message: string };
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const addToast = React.useCallback((type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

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
    // Guard /admin: only admins allowed. Keep admins on /admin across refresh.
    if (!token) {
      if (typeof window !== 'undefined') {
        try { window.sessionStorage.setItem('nextPath', window.location.pathname + window.location.search + window.location.hash); } catch {}
      }
      router.replace(loginUrl);
      return;
    }
    if (role !== 'admin') {
      router.replace('/');
    }
  }, [token, role, router, loginUrl]);

  const fetchAll = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/questions');
      const data = res.data;
      const list: QuestionItem[] = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : [];
      setItems(list);
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

  async function parseFileForPreview(file: File) {
    setParsing(true);
    setPreviewRows([]);
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith('.csv')) {
        // dynamic import papaparse only in browser
        const Papa = (await import('papaparse')).default;
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
              setPreviewRows(results.data as any[]);
              resolve();
            },
            error: (err: any) => reject(err)
          });
        });
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const XLSX = (await import('xlsx')).default;
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setPreviewRows(json as any[]);
      } else {
        setError('Unsupported file type. Please choose .csv or .xlsx');
      }
    } catch (e:any) {
      setError(e?.message || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    setPreviewRows([]);
    if (file) {
      await parseFileForPreview(file);
    }
  }

  async function confirmUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const { data } = await api.post('/api/questions/bulk', formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Let browser set proper multipart boundary
        }
      });
      console.log('Bulk upload response:', data);
      const insertedCount = Number(data?.inserted ?? 0);
      const skippedCount = Number(data?.skipped ?? 0);
      if (!data?.success || insertedCount === 0) {
        addToast('error', 'No valid rows found. Please check headers in CSV/Excel file');
      } else {
        if (skippedCount > 0) {
          addToast('warning', 'Some rows skipped due to invalid format');
        } else {
          addToast('success', `Bulk upload success. Inserted: ${insertedCount}`);
        }
      }
      setUploadFile(null);
      setPreviewRows([]);
      await fetchAll();
    } catch (err:any) {
      const msg = err?.response?.data?.error || err?.message || 'Bulk upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

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

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded-md border ${activeTab === 'manage' ? 'bg-primary text-white' : ''}`}
          onClick={() => setActiveTab('manage')}
        >Manage</button>
        <button
          className={`px-3 py-1 rounded-md border ${activeTab === 'bulk' ? 'bg-primary text-white' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >Bulk Upload</button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      {activeTab === 'manage' && (
  <div className="rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm p-4">
        <h2 className="text-lg font-medium mb-3">{editingId ? 'Edit Question' : 'Create Question'}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question Text</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Math"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                placeholder="e.g. JEE, NEET, SAT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Unit 1, Chapter 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topic</label>
              <input
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
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
                      className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-2 py-1"
                      placeholder="A"
                    />
                  </div>
                  <div className="col-span-9">
                    <input
                      type="text"
                      value={o.option_text}
                      onChange={(e) => updateOption(idx, { option_text: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-2 py-1"
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
      )}

      {activeTab === 'bulk' && (
  <div className="rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm p-4">
          <h2 className="text-lg font-medium mb-3">Bulk Upload Questions</h2>
          <div className="space-y-3">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} />
            {parsing && <div>Parsing file…</div>}
            {uploadFile && previewRows.length > 0 && (
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      {Object.keys(previewRows[0]).map((h) => (
                        <th key={h} className="px-2 py-1 border-b text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="odd:bg-neutral-50">
                        {Object.keys(previewRows[0]).map((h) => (
                          <td key={h} className="px-2 py-1 border-b">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewRows.length > 50 && (
                  <div className="text-xs text-neutral-500 px-2 py-1">Showing first 50 rows</div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!uploadFile || uploading}
                onClick={confirmUpload}
                className="rounded-md bg-primary hover:opacity-90 text-white px-4 py-2 font-medium disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Confirm Upload'}
              </button>
              {uploadFile && (
                <button type="button" className="rounded-md border px-4 py-2" onClick={() => { setUploadFile(null); setPreviewRows([]); }}>Clear</button>
              )}
            </div>
            <div className="text-xs text-neutral-500">
              Expected headers: Exam, Subject, Unit, Topic, SubTopic, Difficulty, Text, A, B, C, D, CorrectAnswer (A/B/C/D or 1/2/3/4)
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div>Loading…</div>
        ) : items.length === 0 ? (
          <div>No questions found.</div>
        ) : (
          items.map(q => (
            <div key={q.id} className="rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md transition-shadow p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-600">
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
                    <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs border ${o.is_correct ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
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
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-2 shadow text-sm border ${
              t.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : t.type === 'warning'
                ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
