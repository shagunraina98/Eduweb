"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function HomeDashboard() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold text-textPrimary">Welcome{user?.name ? `, ${user.name}` : ''}!</h1>
      <p className="text-textSecondary mt-2">Pick up where you left off:</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/quiz" className="rounded-lg border border-textSecondary/20 bg-card p-4 hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-textPrimary">Start a Quiz</div>
          <div className="text-textSecondary text-sm">Practice by subject, exam, and more</div>
        </Link>
        <Link href="/quiz/attempts" className="rounded-lg border border-textSecondary/20 bg-card p-4 hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-textPrimary">Your Attempts</div>
          <div className="text-textSecondary text-sm">Review performance and solutions</div>
        </Link>
        <Link href="/questions" className="rounded-lg border border-textSecondary/20 bg-card p-4 hover:shadow-md transition-shadow">
          <div className="text-lg font-semibold text-textPrimary">Browse Questions</div>
          <div className="text-textSecondary text-sm">Explore the full question bank</div>
        </Link>
      </div>

      {/* Books */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-center py-6 text-blue-900">Recommended Books for PGT / Commerce Exams</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 1, title: 'Commerce PGT Exam Book 1', link: 'https://amzn.in/d/9nfC4vB', img: 'https://m.media-amazon.com/images/I/71pye9zQJtL._SL1500_.jpg' },
            { id: 2, title: 'Accountancy PGT Exam Book 2', link: 'https://amzn.in/d/0bx9XRL', img: 'https://m.media-amazon.com/images/I/81IhLxZs5TL._SL1500_.jpg' },
            { id: 3, title: 'Business Studies PGT Exam Book 3', link: 'https://amzn.in/d/ilHdGP8', img: 'https://m.media-amazon.com/images/I/81O7U0Q7QVL._SL1500_.jpg' },
          ].map((b) => (
            <div key={b.id} className="border rounded-xl bg-white p-6 shadow hover:shadow-xl transition-transform">
              <h3 className="text-lg font-bold text-blue-900">{b.title}</h3>
              <div className="relative w-full h-60 mt-4 rounded-lg overflow-hidden">
                <Image src={b.img} alt={b.title} fill className="object-cover" />
              </div>
              <a
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold transform hover:scale-105 transition"
              >
                Explore Now
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
