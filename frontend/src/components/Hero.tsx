"use client";
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-secondary/10 to-background" />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-3xl text-textPrimary">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Learn. Practice. Excel.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-textSecondary">
            Discover curated questions and interactive quizzes to boost your exam readiness.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/register" className="inline-flex items-center rounded-md bg-primary text-white hover:opacity-90 px-6 py-3 font-semibold shadow">
              Get Started
            </Link>
            <Link href="/login" className="inline-flex items-center rounded-md border border-textSecondary/30 hover:bg-card px-6 py-3 font-semibold text-textPrimary">
              Login / Register
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
