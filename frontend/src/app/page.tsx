import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900 via-sky-800 to-slate-900" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Start your Learning Journey</h1>
          <p className="mt-4 text-lg md:text-xl text-sky-100">
            Explore questions, take quizzes, and grow your skills with Eduweb.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/register" className="rounded-md bg-white text-sky-700 hover:bg-sky-50 px-6 py-3 font-semibold">Sign Up</Link>
            <Link href="/login" className="rounded-md border border-white/70 hover:bg-white/10 px-6 py-3 font-semibold">Login</Link>
          </div>
        </div>
      </section>

      {/* Features preview */}
      <section className="mx-auto max-w-5xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Practice Questions</h3>
          <p className="mt-2 text-slate-300">Browse curated questions across subjects and difficulty levels.</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Timed Quizzes</h3>
          <p className="mt-2 text-slate-300">Test your knowledge with quick quizzes and track your progress.</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Admin Tools</h3>
          <p className="mt-2 text-slate-300">Manage questions and review performance with admin features.</p>
        </div>
      </section>
    </main>
  );
}
