"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, role } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const next = searchParams.get('next');
    if (typeof window !== 'undefined' && next) {
      try { window.sessionStorage.setItem('nextPath', next); } catch {}
    }
    if (role) {
      const storedNext = typeof window !== 'undefined' ? window.sessionStorage.getItem('nextPath') : null;
      if (storedNext) {
        if (typeof window !== 'undefined') window.sessionStorage.removeItem('nextPath');
        router.replace(storedNext);
      } else {
        router.replace('/questions');
      }
    }
  }, [role, router, searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      const { token, user } = res.data || {};
      if (!token || !user) throw new Error('Invalid response');
  // login() will handle redirect using next/sessionStorage
  login(token, user);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card rounded-lg shadow p-6 border border-textSecondary/20">
        <h1 className="text-2xl font-semibold mb-4 text-center text-textPrimary">Create your account</h1>
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-textSecondary/30 bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-textSecondary/30 bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-textSecondary/30 bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:opacity-90 text-white px-4 py-2 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-textSecondary">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
