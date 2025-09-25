import '../styles/globals.css';
import type { Metadata } from 'next';
import { clsx } from 'clsx';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Eduweb',
  description: 'Next.js 14 + Tailwind + Axios starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={clsx('min-h-screen antialiased bg-background text-textPrimary')}>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
