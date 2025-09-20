'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

const Quiz = ({ filters = {}, onQuizComplete = null }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch questions from API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/quiz?${params.toString()}`);
      const questionsData = response.data.questions || response.data;
      
      if (Array.isArray(questionsData) && questionsData.length > 0) {
        setQuestions(questionsData);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setSelectedAnswer('');
      } else {
        setError('No questions found for the selected criteria.');
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError('Failed to load quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions when component mounts or filters change
  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  // Handle option selection
  const handleOptionSelect = (optionValue) => {
    setSelectedAnswer(optionValue);
  };

  // Handle moving to next question
  const handleNextQuestion = () => {
    if (selectedAnswer) {
      const currentQuestion = questions[currentQuestionIndex];
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer
      }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        // Quiz completed
        if (onQuizComplete) {
          onQuizComplete({
            ...userAnswers,
            [currentQuestion.id]: selectedAnswer
          });
        }
      }
    }
  };

  // Handle moving to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = questions[currentQuestionIndex - 1];
      setSelectedAnswer(userAnswers[prevQuestion.id] || '');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-white text-lg">Loading quiz questions...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
        <div className="text-white text-center">
          <p className="font-medium">Error</p>
          <p className="text-red-200 mt-1">{error}</p>
          <button
            onClick={fetchQuestions}
            className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="text-white text-center py-8">
        <p>No questions available. Please try different filters.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-white text-sm">
            Progress: {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="text-white mb-6">
          <h2 className="text-xl font-medium mb-2">
            {currentQuestion.question_text}
          </h2>
          {currentQuestion.subject && (
            <span className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded">
              {currentQuestion.subject}
            </span>
          )}
          {currentQuestion.difficulty && (
            <span className="inline-block ml-2 px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded">
              {currentQuestion.difficulty}
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {[
            { key: 'A', value: currentQuestion.option_a },
            { key: 'B', value: currentQuestion.option_b },
            { key: 'C', value: currentQuestion.option_c },
            { key: 'D', value: currentQuestion.option_d }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => handleOptionSelect(option.key)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-white ${
                selectedAnswer === option.key
                  ? 'border-blue-500 bg-blue-900/50'
                  : 'border-slate-600 bg-slate-700 hover:border-slate-500 hover:bg-slate-600'
              }`}
            >
              <span className="font-medium text-white">{option.key}.</span>{' '}
              <span className="text-white">{option.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          Previous
        </button>

        <div className="text-white text-sm">
          {Object.keys(userAnswers).length + (selectedAnswer ? 1 : 0)} of {questions.length} answered
        </div>

        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next'}
        </button>
      </div>

      {/* Questions overview */}
      <div className="mt-6 bg-slate-800 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3">Questions Overview</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                setCurrentQuestionIndex(index);
                setSelectedAnswer(userAnswers[question.id] || '');
              }}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : userAnswers[question.id]
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-600 text-white hover:bg-slate-500'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;