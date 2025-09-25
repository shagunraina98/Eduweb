"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

export default function Header() {
  const { token, role, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  const linkBase = 'text-sm md:text-[15px] font-medium transition-colors';
  const linkClass = (href: string) => (
    `${linkBase} ${pathname === href ? 'text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`
  );

  return (
    <header className={`sticky top-0 z-40 transition-colors ${scrolled ? 'bg-white/90 shadow-md backdrop-blur-sm' : 'bg-white/80'}`}>
      <nav className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white font-bold">E</span>
          <span className="text-lg md:text-xl font-semibold text-textPrimary">Eduweb</span>
        </Link>

        {/* Center: Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link className={linkClass('/')} href="/">Home</Link>
          <Link className={linkClass('/questions')} href="/questions">Questions</Link>
          <Link className={linkClass('/quiz')} href="/quiz">Quiz</Link>
          {role === 'admin' && (
            <Link className={linkClass('/admin')} href="/admin">Admin</Link>
          )}
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          {!token ? (
            <>
              <Link className="hidden md:inline-block text-textSecondary hover:text-textPrimary text-sm" href="/login">Login</Link>
              <Link className="inline-flex items-center rounded-md bg-primary hover:opacity-90 text-white px-3 py-1.5 text-sm shadow-sm" href="/register">Sign Up</Link>
            </>
          ) : (
            <button onClick={handleLogout} className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90">Logout</button>
          )}
        </div>
      </nav>
    </header>
  );
}
