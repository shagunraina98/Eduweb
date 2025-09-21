'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  // Check authentication on component mount
  useEffect(() => {
    if (!token && quizStarted) {
      setShowAuthMessage(true);
    }
  }, [token, quizStarted]);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Scroll to top when results are displayed
  useEffect(() => {
    if (quizResult) {
      window.scrollTo(0, 0);
    }
  }, [quizResult]);

  const loadFilterOptions = async () => {
    try {
      setLoadingFilters(true);
      console.log('Loading filter options...');
      const response = await api.get('/api/quiz/start');
      console.log('Filter options response:', response.data);
      
      if (response.data && response.data.filters) {
        const safeFilterOptions = {
          exam: Array.isArray(response.data.filters.exam) ? response.data.filters.exam : [],
          subject: Array.isArray(response.data.filters.subject) ? response.data.filters.subject : [],
          unit: Array.isArray(response.data.filters.unit) ? response.data.filters.unit : [],
          topic: Array.isArray(response.data.filters.topic) ? response.data.filters.topic : [],
          subtopic: Array.isArray(response.data.filters.subtopic) ? response.data.filters.subtopic : [],
          difficulty: Array.isArray(response.data.filters.difficulty) ? response.data.filters.difficulty : []
        };
        setFilterOptions(safeFilterOptions);
      }
    } catch (error: any) {
      console.error('Error loading filter options:', error);
      console.error('Error response:', error.response?.data);
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

      console.log('Fetching quiz with params:', params.toString());
      const response = await api.get(`/api/quiz/start?${params.toString()}`);
      console.log('Quiz response:', response.data);
      
      if (response.data && response.data.questions) {
        const safeQuestions = Array.isArray(response.data.questions) ? response.data.questions : [];
        setQuestions(safeQuestions);
        
        if (safeQuestions.length === 0) {
          alert('No questions found with the selected filters. Please try different filter options.');
          return;
        }
      } else {
        setQuestions([]);
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
      setShowAuthMessage(true);
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

  const renderAuthMessage = () => (
    <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-yellow-100 mb-2">Authentication Required</h2>
      <p className="text-yellow-200 mb-4">
        You need to be logged in to submit a quiz. Please log in to continue.
      </p>
      <button
        onClick={() => router.push('/login')}
        className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors"
      >
        Go to Login
      </button>
    </div>
  );

  const renderFilterForm = () => (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">Quiz Settings</h2>
      
      {loadingFilters ? (
        <div className="text-center py-4">
          <div className="text-slate-300">Loading filter options...</div>
        </div>
      ) : (
        <>
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Exam Filter */}
            <div>
              <label htmlFor="exam" className="block text-sm font-medium text-slate-300 mb-2">
                Exam
              </label>
              <select
                id="exam"
                value={filters.exam}
                onChange={(e) => handleFilterChange('exam', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Exams</option>
                {filterOptions.exam.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                Subject
              </label>
              <select
                id="subject"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {filterOptions.subject.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Unit Filter */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-slate-300 mb-2">
                Unit
              </label>
              <select
                id="unit"
                value={filters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Units</option>
                {filterOptions.unit.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
                Topic
              </label>
              <select
                id="topic"
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Topics</option>
                {filterOptions.topic.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            {/* Sub-topic Filter */}
            <div>
              <label htmlFor="subtopic" className="block text-sm font-medium text-slate-300 mb-2">
                Sub-topic
              </label>
              <select
                id="subtopic"
                value={filters.subtopic}
                onChange={(e) => handleFilterChange('subtopic', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sub-topics</option>
                {filterOptions.subtopic.map(subtopic => (
                  <option key={subtopic} value={subtopic}>{subtopic}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label htmlFor="limit" className="block text-sm font-medium text-slate-300 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              id="limit"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 10)}
              min="1"
              max="100"
              className="w-full md:w-48 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Quiz Button */}
          <div className="flex justify-center">
            <button
              onClick={startQuiz}
              disabled={loading || loadingFilters}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-lg"
            >
              {loading ? 'Loading Quiz...' : 'Start Quiz'}
            </button>
          </div>

          {/* Active Filters Display */}
          {(filters.exam || filters.subject || filters.unit || filters.topic || filters.subtopic || filters.difficulty) && (
            <div className="mt-4 p-3 bg-slate-700 rounded-md">
              <div className="text-sm text-slate-300 mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {filters.exam && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    Exam: {filters.exam}
                  </span>
                )}
                {filters.subject && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                    Subject: {filters.subject}
                  </span>
                )}
                {filters.unit && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                    Unit: {filters.unit}
                  </span>
                )}
                {filters.topic && (
                  <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                    Topic: {filters.topic}
                  </span>
                )}
                {filters.subtopic && (
                  <span className="px-2 py-1 bg-pink-600 text-white text-xs rounded">
                    Sub-topic: {filters.subtopic}
                  </span>
                )}
                {filters.difficulty && (
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
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
    <div key={question.id} className="bg-slate-800 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-medium text-white mb-4">
        {index + 1}. {question.text}
      </h3>
      
      <div className="space-y-3">
        {question.options.map(option => (
          <label
            key={option.id}
            className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700 p-2 rounded transition-colors"
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.id}
              checked={selections[question.id] === option.id}
              onChange={() => handleOptionSelect(question.id, option.id)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
            />
            <span className="text-white">
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
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quiz Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Questions */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {attemptedQuestions}
              </div>
              <div className="text-sm text-slate-300">
                Total Questions
              </div>
            </div>

            {/* Attempted Questions */}
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-300 mb-1">
                {attemptedQuestions}
              </div>
              <div className="text-sm text-slate-300">
                Attempted
              </div>
            </div>

            {/* Correct Answers */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {correctAnswers}
              </div>
              <div className="text-sm text-slate-300">
                Correct
              </div>
            </div>

            {/* Wrong Answers */}
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {wrongAnswers}
              </div>
              <div className="text-sm text-slate-300">
                Wrong
              </div>
            </div>
          </div>

          {/* Score Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Score</span>
              <span className="text-sm text-slate-300">{quizResult.percentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  quizResult.percentage >= 80 ? 'bg-green-500' :
                  quizResult.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${quizResult.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Performance Message */}
          <div className="mt-4 text-center">
            <p className={`text-lg font-medium ${
              quizResult.percentage >= 80 ? 'text-green-400' :
              quizResult.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {quizResult.percentage >= 80 ? '🎉 Excellent Performance!' :
               quizResult.percentage >= 60 ? '👍 Good Job!' : '📚 Keep Learning!'}
            </p>
          </div>
        </div>

        {/* Final Score Summary (existing) */}
        <div className="bg-slate-800 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
          <p className="text-3xl font-bold text-white mb-2">
            You scored {quizResult.score}/{quizResult.total}
          </p>
          <p className="text-xl text-slate-300">
            {quizResult.percentage}% correct
          </p>
          <div className="mt-4">
            <button
              onClick={retakeQuiz}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Detailed Results</h3>
          {quizResult.details.map((detail, index) => {
            const question = questions.find(q => q.id === detail.question_id);
            const selectedOption = getSelectedOptionForQuestion(detail.question_id);
            
            if (!question || !selectedOption) return null;

            return (
              <div key={detail.question_id} className="bg-slate-800 rounded-lg p-6">
                <h4 className="text-lg font-medium text-white mb-4">
                  {index + 1}. {question.text}
                </h4>
                
                <div className="space-y-2">
                  <div className={`p-3 rounded ${detail.is_correct ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
                    <span className="text-white font-medium">Your answer: </span>
                    <span className={detail.is_correct ? 'text-green-300' : 'text-red-300'}>
                      {selectedOption.label}. {selectedOption.option_text}
                    </span>
                  </div>
                  
                  {!detail.is_correct && (
                    <div className="p-3 rounded bg-green-900 border border-green-700">
                      <span className="text-white font-medium">Correct answer: </span>
                      <span className="text-green-300">
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

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Quiz</h1>
      
      {showAuthMessage && renderAuthMessage()}
      
      {quizResult ? (
        renderResults()
      ) : !quizStarted ? (
        renderFilterForm()
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              Quiz Questions ({questions.length} questions)
            </h2>
            <button
              onClick={retakeQuiz}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
            >
              New Quiz
            </button>
          </div>

          {questions.map((question, index) => renderQuestion(question, index))}

          <div className="mt-6 flex justify-center">
            <button
              onClick={submitQuiz}
              disabled={submitting || Object.keys(selections).length !== questions.length}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>

          <div className="mt-4 text-center text-slate-400 text-sm">
            Selected {Object.keys(selections).length} of {questions.length} questions
          </div>
        </div>
      )}
    </main>
  );
}
