"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { token, role, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-sky-400 font-semibold text-lg">Eduweb</Link>
        <div className="flex items-center gap-6">
          <Link className="text-slate-200 hover:text-white" href="/">Home</Link>
          <Link className="text-slate-200 hover:text-white" href="/questions">Questions</Link>
          <Link className="text-slate-200 hover:text-white" href="/quiz">Quiz</Link>
          {role === 'admin' && (
            <Link className="text-slate-200 hover:text-white" href="/admin">Admin</Link>
          )}
          {!token ? (
            <div className="flex items-center gap-3">
              <Link className="text-slate-200 hover:text-white" href="/login">Login</Link>
              <Link className="rounded-md bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-sm" href="/register">Sign Up</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700">Logout</button>
          )}
        </div>
      </nav>
    </header>
  );
}
