import Link from 'next/link';
import Hero from '@/components/Hero';
import FeatureCard from '@/components/FeatureCard';
import { clsx } from 'clsx';

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <Hero />

      {/* Features / Why Choose Us */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-textPrimary text-center">Why Choose Us</h2>
        <p className="text-textSecondary text-center mt-2">Built to help students prepare with confidence.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/questions"
            aria-label="Browse the wide question bank"
            className="block rounded-xl transform transition-transform hover:scale-[1.02] focus:scale-[1.02] hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <FeatureCard
              icon={<span className="material-icons">library_books</span>}
              title="Wide Question Bank"
              description="Access a large collection across exams, subjects, and difficulty levels."
            />
          </Link>
          <Link
            href="/quiz"
            aria-label="Start interactive quizzes"
            className="block rounded-xl transform transition-transform hover:scale-[1.02] focus:scale-[1.02] hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <FeatureCard
              icon={<span className="material-icons">quiz</span>}
              title="Interactive Quizzes"
              description="Customizable quizzes with filters so you practice exactly what you need."
            />
          </Link>
          <Link
            href="/quiz/attempts"
            aria-label="View your progress and attempts"
            className="block rounded-xl transform transition-transform hover:scale-[1.02] focus:scale-[1.02] hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <FeatureCard
              icon={<span className="material-icons">insights</span>}
              title="Progress Tracking"
              description="See your scores and improvements over time to focus your efforts."
            />
          </Link>
        </div>
      </section>

      {/* Popular Topics / Sample Questions */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-textPrimary">Explore</h2>
          <div className="text-sm">
            <Link className="text-primary hover:opacity-80" href="/questions">Browse all Questions →</Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['Physics','Chemistry','Mathematics','Biology','Reasoning','English'].map(t => (
            <Link key={t} href={`/questions?subject=${encodeURIComponent(t)}`}
              className="px-4 py-3 rounded-lg border border-textSecondary/20 bg-card text-textPrimary hover:bg-background hover:border-textSecondary/30 text-sm text-center">
              {t}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
