"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootRedirect() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    router.replace('/landing');
  }, [router]);

  return null;
}
