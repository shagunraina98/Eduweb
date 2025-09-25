'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface AttemptAnswer {
  question_id: number;
  selected_option_id: number;
  selected_text: string;
  correct_option_id: number;
  correct_text: string;
}

interface QuizAttempt {
  id: number;
  score: number;
  total: number;
  created_at: string;
  answers: AttemptAnswer[];
}

export default function QuizAttemptsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAttempts, setExpandedAttempts] = useState<Set<number>>(new Set());

  // Check authentication and fetch attempts
  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    fetchAttempts();
  }, [token, user, router]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/quiz/attempts');
      setAttempts(response.data);
    } catch (err: any) {
      console.error('Error fetching quiz attempts:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load quiz attempts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAttemptDetails = (attemptId: number) => {
    setExpandedAttempts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attemptId)) {
        newSet.delete(attemptId);
      } else {
        newSet.add(attemptId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'bg-green-900 border-green-700 text-green-300';
    if (percentage >= 60) return 'bg-yellow-900 border-yellow-700 text-yellow-300';
    return 'bg-red-900 border-red-700 text-red-300';
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-textSecondary text-lg">Loading quiz attempts...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchAttempts}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-textPrimary">Quiz Attempts</h1>
        <button
          onClick={() => router.push('/quiz')}
          className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md transition-colors"
        >
          Take New Quiz
        </button>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-card border border-textSecondary/20 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-textPrimary mb-2">No Quiz Attempts Yet</h2>
          <p className="text-textSecondary mb-4">
            You haven't taken any quizzes yet. Start your first quiz to see your results here.
          </p>
          <button
            onClick={() => router.push('/quiz')}
            className="px-6 py-2 bg-primary hover:opacity-90 text-white font-medium rounded-md transition-colors"
          >
            Take Your First Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const isExpanded = expandedAttempts.has(attempt.id);
            const percentage = Math.round((attempt.score / attempt.total) * 100);
            
            return (
              <div key={attempt.id} className="bg-card border border-textSecondary/20 rounded-lg overflow-hidden">
                {/* Attempt Summary */}
                <div 
                  className="p-6 cursor-pointer hover:bg-background transition-colors"
                  onClick={() => toggleAttemptDetails(attempt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full border ${getScoreBadgeColor(attempt.score, attempt.total)}`}>
                        <span className="font-semibold">
                          {attempt.score}/{attempt.total}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-textPrimary">
                          Quiz #{attempt.id}
                        </h3>
                        <p className="text-textSecondary text-sm">
                          {formatDate(attempt.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(attempt.score, attempt.total)}`}>
                          {percentage}%
                        </div>
                        <div className="text-textSecondary text-sm">
                          {attempt.answers.length} questions
                        </div>
                      </div>
                      <div className="text-textSecondary">
                        <svg 
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-textSecondary/20 p-6">
                    <h4 className="text-lg font-medium text-textPrimary mb-4">Question Details</h4>
                    <div className="space-y-4">
                      {attempt.answers.map((answer, index) => {
                        const isCorrect = answer.selected_option_id === answer.correct_option_id;
                        
                        return (
                          <div key={`${attempt.id}-${answer.question_id}`} className="bg-background rounded-lg p-4 border border-textSecondary/20">
                            <div className="flex items-start justify-between mb-3">
                              <h5 className="text-textPrimary font-medium">
                                Question {index + 1}
                              </h5>
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {/* Selected Answer */}
                              <div className={`p-3 rounded ${
                                isCorrect 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'bg-red-50 border border-red-200'
                              }`}>
                                <span className="text-textPrimary font-medium">Your answer: </span>
                                <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                  {answer.selected_text}
                                </span>
                              </div>
                              
                              {/* Correct Answer (if different) */}
                              {!isCorrect && (
                                <div className="p-3 rounded bg-green-50 border border-green-200">
                                  <span className="text-textPrimary font-medium">Correct answer: </span>
                                  <span className="text-green-700">
                                    {answer.correct_text}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}