"use client";
import { useMemo } from 'react';

/**
 * Returns helpers to build a login URL with ?next=<currentPath> and to push to login preserving next.
 */
export function useLoginRedirect() {
  const currentPath = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    const { pathname, search, hash } = window.location;
    return `${pathname}${search}${hash}`;
  }, []);

  const loginUrl = useMemo(() => {
    const encoded = encodeURIComponent(currentPath);
    return `/login?next=${encoded}`;
  }, [currentPath]);

  return { currentPath, loginUrl };
}
