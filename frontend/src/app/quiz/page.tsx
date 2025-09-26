'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginRedirect } from '@/lib/useLoginRedirect';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface Question {
  id: number;
  text: string;
  subject: string;
  difficulty: string;
  exam?: string;
  unit?: string;
  topic?: string;
  subtopic?: string;
  options: Array<{
    id: number;
    label: string;
    option_text: string;
  }>;
}

interface FilterOptions {
  exam: string[];
  subject: string[];
  unit: string[];
  topic: string[];
  subtopic: string[];
  difficulty: string[];
}

interface QuizFilters {
  exam: string;
  subject: string;
  unit: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  limit: number;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  attempt_id: number;
  details: Array<{
    question_id: number;
    selected_option_id: number;
    correct_option_id: number;
    correct_option_text: string;
    is_correct: boolean;
  }>;
}

export default function QuizPage() {
  const router = useRouter();
  const { token, id: userId } = useAuth();
  const { loginUrl } = useLoginRedirect();
  
  const [filters, setFilters] = useState<QuizFilters>({
    exam: '',
    subject: '',
    unit: '',
    topic: '',
    subtopic: '',
    difficulty: '',
    limit: 10
  });
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    exam: [],
    subject: [],
    unit: [],
    topic: [],
    subtopic: [],
    difficulty: []
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selections, setSelections] = useState<{ [questionId: number]: number }>({});
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  // Require login: if user not logged in, immediately redirect to /login (no message)
  useEffect(() => {
    if (!token) {
      if (typeof window !== 'undefined') {
        try { window.sessionStorage.setItem('nextPath', window.location.pathname + window.location.search + window.location.hash); } catch {}
      }
      router.push(loginUrl);
    }
  }, [token, router, loginUrl]);

  // Load filter options only when authenticated
  useEffect(() => {
    if (token) {
      loadFilterOptions();
    }
  }, [token]);

  // Scroll to top when results are displayed
  useEffect(() => {
    if (quizResult) {
      window.scrollTo(0, 0);
    }
  }, [quizResult]);

  const loadFilterOptions = async () => {
    try {
      setLoadingFilters(true);
      
      // Try new endpoint first, fallback to old endpoint
      let response;
      try {
        response = await api.get('/api/quiz/start');
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await api.get('/api/quiz?limit=50'); // Get more questions for better filter extraction
        } else {
          throw error;
        }
      }
      
      let filtersData: FilterOptions = {
        exam: [],
        subject: [],
        unit: [],
        topic: [],
        subtopic: [],
        difficulty: []
      };
      
      if (Array.isArray(response.data)) {
        // Old API structure: extract filters from questions array
        const questions: Question[] = response.data;
        
        const extractUniqueValues = (field: keyof Question) => {
          return [...new Set(questions
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
          difficulty: extractUniqueValues('difficulty')
        };
      } else if (response.data && response.data.filters) {
        // New API structure: use provided filters
        filtersData = {
          exam: Array.isArray(response.data.filters.exam) ? response.data.filters.exam : [],
          subject: Array.isArray(response.data.filters.subject) ? response.data.filters.subject : [],
          unit: Array.isArray(response.data.filters.unit) ? response.data.filters.unit : [],
          topic: Array.isArray(response.data.filters.topic) ? response.data.filters.topic : [],
          subtopic: Array.isArray(response.data.filters.subtopic) ? response.data.filters.subtopic : [],
          difficulty: Array.isArray(response.data.filters.difficulty) ? response.data.filters.difficulty : []
        };
      }
      
      setFilterOptions(filtersData);
    } catch (error: any) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleFilterChange = (field: keyof QuizFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startQuiz = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.exam) params.append('exam', filters.exam);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.unit) params.append('unit', filters.unit);
      if (filters.topic) params.append('topic', filters.topic);
      if (filters.subtopic) params.append('subtopic', filters.subtopic);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      params.append('limit', filters.limit.toString());

      // Try new endpoint first, fallback to old endpoint
      let response;
      try {
        response = await api.get(`/api/quiz/start?${params.toString()}`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await api.get(`/api/quiz?${params.toString()}`);
        } else {
          throw error;
        }
      }
      
      // Handle both old and new API structures
      let questionsData: Question[] = [];
      let filtersData: FilterOptions = {
        exam: [],
        subject: [],
        unit: [],
        topic: [],
        subtopic: [],
        difficulty: []
      };
      
      if (Array.isArray(response.data)) {
        // Old API structure: returns array directly
        questionsData = response.data;
        
        // Extract unique filter values from questions for old API
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
          difficulty: extractUniqueValues('difficulty')
        };
      } else if (response.data && response.data.questions) {
        // New API structure: returns {questions: [...], filters: {...}}
        questionsData = Array.isArray(response.data.questions) ? response.data.questions : [];
        filtersData = response.data.filters || filtersData;
      }
      
      setQuestions(questionsData);
      
      // Update filter options if we have them
      if (Object.values(filtersData).some(arr => arr.length > 0)) {
        setFilterOptions(filtersData);
      }
      
      if (questionsData.length === 0) {
        alert('No questions found with the selected filters. Please try different filter options.');
        return;
      }
      
      setQuizStarted(true);
      setSelections({});
      setQuizResult(null);
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setSelections(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const submitQuiz = async () => {
    // Check authentication
    if (!token || !userId) {
      if (typeof window !== 'undefined') {
        try { window.sessionStorage.setItem('nextPath', window.location.pathname + window.location.search + window.location.hash); } catch {}
      }
      router.push(loginUrl);
      return;
    }

    // Validate all questions answered
    if (Object.keys(selections).length !== questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare answers in the required format
      const answers = questions.map(question => ({
        question_id: question.id,
        selected_option_id: selections[question.id]
      }));

      console.log('Submitting quiz with answers:', answers);
      console.log('Token available:', !!token);
      
      const response = await api.post('/api/quiz/submit', { answers });
      console.log('Quiz submission response:', response.data);
      setQuizResult(response.data);
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        setShowAuthMessage(true);
      } else if (error.response?.data?.error) {
        alert(`Failed to submit quiz: ${error.response.data.error}`);
      } else {
        alert('Failed to submit quiz. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const retakeQuiz = () => {
    setQuizStarted(false);
    setQuestions([]);
    setSelections({});
    setQuizResult(null);
    setShowAuthMessage(false);
    // Reset filters to default values
    setFilters({
      exam: '',
      subject: '',
      unit: '',
      topic: '',
      subtopic: '',
      difficulty: '',
      limit: 10
    });
    // Reload filter options
    loadFilterOptions();
  };

  const getSelectedOptionForQuestion = (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return null;
    
    const selectedOptionId = selections[questionId];
    return question.options.find(opt => opt.id === selectedOptionId);
  };

  // No auth message UI required per requirement (immediate redirect only)

  const renderFilterForm = () => (
    <div className="bg-card rounded-lg p-6 mb-6 border border-textSecondary/20">
      <h2 className="text-xl font-semibold text-textPrimary mb-4">Quiz Settings</h2>
      
      {loadingFilters ? (
        <div className="text-center py-4">
          <div className="text-textSecondary">Loading filter options...</div>
        </div>
      ) : (
        <>
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Exam Filter */}
            <div>
              <label htmlFor="exam" className="block text-sm font-medium text-textSecondary mb-2">
                Exam
              </label>
              <select
                id="exam"
                value={filters.exam}
                onChange={(e) => handleFilterChange('exam', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Exams</option>
                {filterOptions.exam.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-textSecondary mb-2">
                Subject
              </label>
              <select
                id="subject"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Subjects</option>
                {filterOptions.subject.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Unit Filter */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-textSecondary mb-2">
                Unit
              </label>
              <select
                id="unit"
                value={filters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Units</option>
                {filterOptions.unit.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-textSecondary mb-2">
                Topic
              </label>
              <select
                id="topic"
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Topics</option>
                {filterOptions.topic.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            {/* Sub-topic Filter */}
            <div>
              <label htmlFor="subtopic" className="block text-sm font-medium text-textSecondary mb-2">
                Sub-topic
              </label>
              <select
                id="subtopic"
                value={filters.subtopic}
                onChange={(e) => handleFilterChange('subtopic', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Sub-topics</option>
                {filterOptions.subtopic.map(subtopic => (
                  <option key={subtopic} value={subtopic}>{subtopic}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-textSecondary mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Difficulties</option>
                {filterOptions.difficulty.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Number of Questions */}
          <div className="mb-6">
            <label htmlFor="limit" className="block text-sm font-medium text-textSecondary mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              id="limit"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 10)}
              min="1"
              max="100"
              className="w-full md:w-48 px-3 py-2 bg-background border border-textSecondary/30 rounded-md text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Start Quiz Button */}
          <div className="flex justify-center">
            <button
              onClick={startQuiz}
              disabled={loading || loadingFilters}
              className="px-8 py-3 bg-primary hover:opacity-90 disabled:bg-textSecondary/40 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-lg"
            >
              {loading ? 'Loading Quiz...' : 'Start Quiz'}
            </button>
          </div>

          {/* Active Filters Display */}
          {(filters.exam || filters.subject || filters.unit || filters.topic || filters.subtopic || filters.difficulty) && (
            <div className="mt-4 p-3 bg-background rounded-md border border-textSecondary/20">
              <div className="text-sm text-textSecondary mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {filters.exam && (
                  <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                    Exam: {filters.exam}
                  </span>
                )}
                {filters.subject && (
                  <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                    Subject: {filters.subject}
                  </span>
                )}
                {filters.unit && (
                  <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                    Unit: {filters.unit}
                  </span>
                )}
                {filters.topic && (
                  <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                    Topic: {filters.topic}
                  </span>
                )}
                {filters.subtopic && (
                  <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                    Sub-topic: {filters.subtopic}
                  </span>
                )}
                {filters.difficulty && (
                  <span className="px-2 py-1 bg-primary text-white text-xs rounded">
                    Difficulty: {filters.difficulty}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderQuestion = (question: Question, index: number) => (
    <div key={question.id} className="bg-card border border-textSecondary/20 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-medium text-textPrimary mb-4">
        {index + 1}. {question.text}
      </h3>
      
      <div className="space-y-3">
        {question.options.map(option => (
          <label
            key={option.id}
            className="flex items-center space-x-3 cursor-pointer hover:bg-background p-2 rounded transition-colors"
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.id}
              checked={selections[question.id] === option.id}
              onChange={() => handleOptionSelect(question.id, option.id)}
              className="w-4 h-4 text-primary bg-background border-textSecondary/40 focus:ring-primary"
            />
            <span className="text-textPrimary">
              {option.label}. {option.option_text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderResults = () => {
    if (!quizResult) return null;

    const attemptedQuestions = questions.length;
    const correctAnswers = quizResult.score;
    const wrongAnswers = attemptedQuestions - correctAnswers;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-card rounded-lg shadow p-6 border border-textSecondary/20">
          <h2 className="text-2xl font-bold text-textPrimary mb-6 text-center">Quiz Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Questions */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {attemptedQuestions}
              </div>
              <div className="text-sm text-textSecondary">
                Total Questions
              </div>
            </div>

            {/* Attempted Questions */}
            <div className="text-center">
              <div className="text-3xl font-bold text-textSecondary mb-1">
                {attemptedQuestions}
              </div>
              <div className="text-sm text-textSecondary">
                Attempted
              </div>
            </div>

            {/* Correct Answers */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {correctAnswers}
              </div>
              <div className="text-sm text-textSecondary">
                Correct
              </div>
            </div>

            {/* Wrong Answers */}
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {wrongAnswers}
              </div>
              <div className="text-sm text-textSecondary">
                Wrong
              </div>
            </div>
          </div>

          {/* Score Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-textSecondary">Score</span>
              <span className="text-sm text-textSecondary">{quizResult.percentage}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-3 border border-textSecondary/20">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  quizResult.percentage >= 80 ? 'bg-green-600' :
                  quizResult.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${quizResult.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Performance Message */}
          <div className="mt-4 text-center">
            <p className={`text-lg font-medium ${
              quizResult.percentage >= 80 ? 'text-green-700' :
              quizResult.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {quizResult.percentage >= 80 ? '🎉 Excellent Performance!' :
               quizResult.percentage >= 60 ? '👍 Good Job!' : '📚 Keep Learning!'}
            </p>
          </div>
        </div>

        {/* Final Score Summary (existing) */}
        <div className="bg-card rounded-lg p-6 text-center border border-textSecondary/20">
          <h3 className="text-2xl font-bold text-textPrimary mb-2">Quiz Complete!</h3>
          <p className="text-3xl font-bold text-textPrimary mb-2">
            You scored {quizResult.score}/{quizResult.total}
          </p>
          <p className="text-xl text-textSecondary">
            {quizResult.percentage}% correct
          </p>
          <div className="mt-4">
            <button
              onClick={retakeQuiz}
              className="px-6 py-2 bg-primary hover:opacity-90 text-white font-medium rounded-md transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-textPrimary">Detailed Results</h3>
          {quizResult.details.map((detail, index) => {
            const question = questions.find(q => q.id === detail.question_id);
            const selectedOption = getSelectedOptionForQuestion(detail.question_id);
            
            if (!question || !selectedOption) return null;

            return (
              <div key={detail.question_id} className="bg-card border border-textSecondary/20 rounded-lg p-6">
                <h4 className="text-lg font-medium text-textPrimary mb-4">
                  {index + 1}. {question.text}
                </h4>
                
                <div className="space-y-2">
                  <div className={`p-3 rounded ${detail.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <span className="text-textPrimary font-medium">Your answer: </span>
                    <span className={detail.is_correct ? 'text-green-700' : 'text-red-700'}>
                      {selectedOption.label}. {selectedOption.option_text}
                    </span>
                  </div>
                  
                  {!detail.is_correct && (
                    <div className="p-3 rounded bg-green-50 border border-green-200">
                      <span className="text-textPrimary font-medium">Correct answer: </span>
                      <span className="text-green-700">
                        {detail.correct_option_text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // If not authenticated, nothing to render (redirect happens in effect)
  if (!token) return null;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold text-textPrimary mb-6">Quiz</h1>
      
  {/* Auth message removed: immediate redirect behavior */}
      
      {quizResult ? (
        renderResults()
      ) : !quizStarted ? (
        renderFilterForm()
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-textPrimary">
              Quiz Questions ({questions.length} questions)
            </h2>
            <button
              onClick={retakeQuiz}
              className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md transition-colors"
            >
              New Quiz
            </button>
          </div>

          {questions.length > 0 ? (
            questions.map((question, index) => renderQuestion(question, index))
          ) : (
            <div className="bg-card border border-textSecondary/20 p-6 rounded-lg text-center">
              <p className="text-textSecondary">No questions to display. Questions array is empty.</p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={submitQuiz}
              disabled={submitting || Object.keys(selections).length !== questions.length}
              className="px-8 py-3 bg-primary hover:opacity-90 disabled:bg-textSecondary/40 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>

          <div className="mt-4 text-center text-textSecondary text-sm">
            Selected {Object.keys(selections).length} of {questions.length} questions
          </div>
        </div>
      )}
    </main>
  );
}
