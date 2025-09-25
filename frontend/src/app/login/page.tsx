"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, role } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // If already logged in, go to dashboard
  React.useEffect(() => {
    if (!role) return;
    router.replace('/dashboard');
  }, [role, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data || {};
      if (!token || !user) throw new Error('Invalid response');
      login(token, user);
  // AuthContext will redirect to /dashboard
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card rounded-lg shadow p-6 border border-textSecondary/20">
        <h1 className="text-2xl font-semibold mb-4 text-center text-textPrimary">Login</h1>
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
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
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:opacity-90 text-white px-4 py-2 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
