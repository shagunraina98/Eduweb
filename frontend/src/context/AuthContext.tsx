"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

type Role = 'student' | 'admin' | null;

type User = {
  id: number | null;
  role: Role;
  name?: string;
  email?: string;
} | null;

type AuthState = {
  token: string | null;
  user: User;
};

type AuthContextType = {
  token: string | null;
  user: User;
  role: Role; // convenience derived from user
  id: number | null; // convenience derived from user
  login: (token: string, user?: Partial<NonNullable<User>>) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ token: null, user: null });
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('jwt');
    const userRaw = window.localStorage.getItem('user');
    if (token) {
      let user: User = null;
      try {
        user = userRaw ? JSON.parse(userRaw) : null;
      } catch {
        user = null;
      }
      if (!user) {
        const payload = parseJwt(token);
        user = {
          id: payload?.id ?? null,
          role: payload?.role ?? null,
          name: payload?.name,
          email: payload?.email,
        };
      }
      setState({ token, user });
    }
  }, []);

  const login = React.useCallback((token: string, userInput?: Partial<NonNullable<User>>) => {
    const payload = parseJwt(token);
    const user: NonNullable<User> = {
      id: userInput?.id ?? payload?.id ?? null,
      role: (userInput?.role as Role) ?? (payload?.role as Role) ?? null,
      name: userInput?.name ?? payload?.name,
      email: userInput?.email ?? payload?.email,
    };
    window.localStorage.setItem('jwt', token);
    window.localStorage.setItem('user', JSON.stringify(user));
    setState({ token, user });
    // Redirect priority: next param (query or sessionStorage) -> role-based fallback
    try {
      let nextPath: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          nextPath = url.searchParams.get('next');
        } catch {}
        // Fallback to sessionStorage if available
        const storedNext = window.sessionStorage.getItem('nextPath');
        if (!nextPath && storedNext) {
          nextPath = storedNext;
        }
        if (nextPath) {
          // Clean up stored next path to avoid stale redirects
          window.sessionStorage.removeItem('nextPath');
          router.push(nextPath);
          return;
        }
      }
      // Role-based fallback
      if (user.role === 'admin') router.push('/admin');
      else router.push('/');
    } catch {}
  }, [router]);

  const logout = React.useCallback(() => {
    window.localStorage.removeItem('jwt');
    window.localStorage.removeItem('user');
    setState({ token: null, user: null });
  }, []);

  const value: AuthContextType = {
    token: state.token,
    user: state.user,
    role: state.user?.role ?? null,
    id: state.user?.id ?? null,
    login,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
