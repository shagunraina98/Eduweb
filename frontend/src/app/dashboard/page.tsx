"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <main className="mx-auto max-w-7xl px-6 md:px-8 py-10 bg-background">
      <div className="grid gap-6">
        {/* Hero Card */}
        <div className="rounded-2xl border border-textSecondary/20 bg-card p-6 md:p-8 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-textPrimary">
                Welcome{user?.name ? `, ${user.name}` : ''}!
              </h1>
              <p className="mt-2 text-textSecondary">
                Jump back into your learning. Choose an action to continue.
              </p>
            </div>
            <button
              onClick={logout}
              className="h-9 inline-flex items-center rounded-md bg-primary hover:opacity-90 px-4 text-sm text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/quiz" className="group rounded-xl border border-textSecondary/20 bg-card p-6 hover:border-textSecondary/30 hover:bg-background transition-colors">
            <div className="text-textPrimary font-semibold text-lg">Start Quiz</div>
            <p className="text-textSecondary text-sm mt-1">Practice with filtered questions.</p>
            <div className="mt-4 text-primary group-hover:opacity-80 text-sm">Go to Quiz →</div>
          </Link>
          <Link href="/questions" className="group rounded-xl border border-textSecondary/20 bg-card p-6 hover:border-textSecondary/30 hover:bg-background transition-colors">
            <div className="text-textPrimary font-semibold text-lg">View Questions</div>
            <p className="text-textSecondary text-sm mt-1">Explore the question bank.</p>
            <div className="mt-4 text-primary group-hover:opacity-80 text-sm">Browse Questions →</div>
          </Link>
          <Link href="/quiz/attempts" className="group rounded-xl border border-textSecondary/20 bg-card p-6 hover:border-textSecondary/30 hover:bg-background transition-colors">
            <div className="text-textPrimary font-semibold text-lg">View Attempts</div>
            <p className="text-textSecondary text-sm mt-1">Review your past results.</p>
            <div className="mt-4 text-primary group-hover:opacity-80 text-sm">See Attempts →</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
