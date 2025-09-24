"use client";
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900 via-sky-800 to-slate-900" />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-3xl text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Learn. Practice. Excel.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-sky-100/90">
            Discover curated questions and interactive quizzes to boost your exam readiness.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/register" className="inline-flex items-center rounded-md bg-white text-sky-700 hover:bg-sky-50 px-6 py-3 font-semibold shadow">
              Get Started
            </Link>
            <Link href="/login" className="inline-flex items-center rounded-md border border-white/70 hover:bg-white/10 px-6 py-3 font-semibold text-white">
              Login / Register
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
