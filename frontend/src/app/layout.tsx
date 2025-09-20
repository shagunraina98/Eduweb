import '../styles/globals.css';
import type { Metadata } from 'next';
import { clsx } from 'clsx';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Eduweb',
  description: 'Next.js 14 + Tailwind + Axios starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={clsx('min-h-screen antialiased bg-slate-900 text-slate-100')}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
