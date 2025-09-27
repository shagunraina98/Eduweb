"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { token } = useAuth();

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_40%,transparent_100%)]">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[120vw] rounded-full bg-blue-100 blur-3xl opacity-60" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 md:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-blue-900">
                Make Your Study Better with
                <span className="block text-blue-700">BD Online Study Channel</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Prepare for PGT, KVS, NVS, DSSSB, Commerce & GK Exams with expert guidance.
              </p>
              <div className="mt-6 flex items-center justify-center md:justify-start space-x-4">
                <Link href="/questions" className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold shadow">
                  Explore Courses
                </Link>
                {!token && (
                  <Link href="/register" className="inline-flex items-center justify-center rounded-md border-2 border-blue-600 text-blue-700 hover:bg-blue-50 px-6 py-3 font-semibold">
                    Sign Up Free
                  </Link>
                )}
              </div>
            </div>
            {/* Right column intentionally left empty (no image) */}
            <div className="hidden md:block" />
          </div>
        </div>
      </section>

      {/* About Instructor */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-900">About the Instructors</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1">
            <div className="relative h-56 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              <Image src="https://vansh-attri.github.io/Educational-Website/Images/BD.jpg" alt="Instructor Bhisham Datt" fill className="object-cover" />
            </div>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-blue-800">Bhisham Datt</h3>
            <p className="mt-2 text-gray-700">
              M.Com, M.Phil, M.A. Economics, B.Ed, Assistant Professor & Head, Dept. of Commerce, AS (PG) College, UP
            </p>
            <p className="mt-2 text-gray-600">Dedicated educator with years of experience mentoring students for competitive exams.</p>
            <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
              Co‑instructor: <span className="font-medium">Pushpa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-blue-50/60">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900 text-center">Why Choose Us</h2>
          <p className="text-gray-600 text-center mt-2">A modern study experience, built for results.</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Wide Question Bank', desc: 'Thousands of curated questions across exams and difficulty levels.', icon: '📚' },
              { title: 'Interactive Quizzes', desc: 'Practice with customizable filters and instant feedback.', icon: '🧠' },
              { title: 'Progress Tracking', desc: 'Monitor your attempts and see improvements over time.', icon: '📈' },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl">{c.icon}</div>
                <h3 className="mt-3 text-lg font-semibold text-blue-800">{c.title}</h3>
                <p className="mt-2 text-gray-600">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Books */}
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
        <h2 className="text-2xl font-bold text-center py-6 text-blue-900">Recommended Books for PGT / Commerce Exams</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 1, title: 'Commerce PGT Exam Book 1', link: 'https://amzn.in/d/9nfC4vB', img: 'https://m.media-amazon.com/images/I/819A2X+MtdL._AC_UY327_FMwebp_QL65_.jpg' },
            { id: 2, title: 'Accountancy PGT Exam Book 2', link: 'https://amzn.in/d/0bx9XRL', img: 'https://m.media-amazon.com/images/I/61cpjR+lWgL._AC_UY327_FMwebp_QL65_.jpg' },
            { id: 3, title: 'Business Studies PGT Exam Book 3', link: 'https://amzn.in/d/ilHdGP8', img: 'https://m.media-amazon.com/images/I/91aXrIwzmiL._AC_UY327_FMwebp_QL65_.jpg' },
          ].map((b) => (
            <div key={b.id} className="border rounded-xl bg-white p-6 shadow hover:shadow-xl transition-transform">
              <h3 className="text-lg font-bold text-blue-900">{b.title}</h3>
              <div className="relative w-full h-80 mt-4 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <Image src={b.img} alt={b.title} fill className="object-contain" />
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

      {/* Courses / Playlists */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Popular Courses</h2>
          <p className="text-gray-600 mt-2">YouTube playlists curated for exam success.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                title: 'Commerce Course Series 1',
                description: 'Comprehensive playlist covering fundamental commerce concepts.',
                link: 'https://youtube.com/playlist?list=PLloYqMn5Mvwv11BPq3WQuWSTYBaZFF09r&si=DQRnnA0nKK_wrM__',
                thumbnail: 'https://i.ytimg.com/vi/K_2d3gj-yEE/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLAfszsIDg9ilSpswpCuXiRpgjpKUQ'
              },
              {
                id: 2,
                title: 'Advanced Commerce Topics',
                description: 'Deep dive into advanced commerce and business studies.',
                link: 'https://youtube.com/playlist?list=PLloYqMn5MvwsommDJfRpOXiQAv0cwzd9R&si=ZO4nux4xTXvV1i6k',
                thumbnail: 'https://i.ytimg.com/vi/9gFa7LzxRtA/hqdefault.jpg?sqp=-oaymwExCNACELwBSFryq4qpAyMIARUAAIhCGAHwAQH4AdQGgALgA4oCDAgAEAEYZSBaKEIwDw==&rs=AOn4CLCCIeaviVALQPup8NOfXfggmIzHqQ'
              },
              {
                id: 3,
                title: 'Accountancy Fundamentals',
                description: 'Essential accounting principles and practices.',
                link: 'https://youtube.com/playlist?list=PLloYqMn5MvwvsB4ZSQyHPdt-PlvA9_Qeq&si=L_p1nteOQetk3zbb',
                thumbnail: 'https://i.ytimg.com/vi/5Zo7HVUyhqg/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLCFV3GIwGhUOt2OdlZsHlN-Z2c1qg'
              },
              {
                id: 4,
                title: 'Business Studies Mastery',
                description: 'Complete guide to business studies for competitive exams.',
                link: 'https://youtube.com/playlist?list=PLloYqMn5MvwsOtKYCZ3-Awk0IFQCeFjnC&si=MepANZgMXX0HTC9z',
                thumbnail: 'https://i.ytimg.com/vi/750Cvooubms/hqdefault.jpg?sqp=-oaymwExCNACELwBSFryq4qpAyMIARUAAIhCGAHwAQH4Af4JgALQBYoCDAgAEAEYciBCKDwwDw==&rs=AOn4CLDjVmmgWNzieV1Vw_rYF3FDgT7UyA'
              },
              {
                id: 5,
                title: 'Economics for PGT',
                description: 'Economics concepts tailored for PGT exam preparation.',
                link: 'https://youtube.com/playlist?list=PLloYqMn5MvwuG5sCQg3oz9siBowf7fzd3&si=92N_DH6qKlElx5Lm',
                thumbnail: 'https://i.ytimg.com/vi/Xhek6iSu31g/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLDazMS3eTIEn9pKBEvIof7_t5bTng'
              },
              {
                id: 6,
                title: 'Exam Strategy & Tips',
                description: 'Strategic approach to PGT commerce examinations.',
                link: 'https://youtube.com/playlist?list=PLloYqMn5Mvwv6D8Hzer2AGBJolYukIfDr&si=FkawY5d087r2-Zro',
                thumbnail: 'https://i.ytimg.com/vi/Ha8Exeqo6ss/hqdefault.jpg?sqp=-oaymwExCNACELwBSFryq4qpAyMIARUAAIhCGAHwAQH4AdQGgALgA4oCDAgAEAEYXCBcKFwwDw==&rs=AOn4CLBk-D0THZ7ux3TGKGEIJ4NbQE3HVQ'
              }
            ].map((course) => (
              <div key={course.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="relative h-40 w-full bg-gray-100">
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-blue-800">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                  <a 
                    href={course.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex mt-3 text-blue-700 hover:underline"
                  >
                    Watch on YouTube →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-50/60">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900 text-center">What Students Say</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Amit', text: 'The quizzes and detailed solutions helped me a lot in PGT prep!', stars: 5 },
              { name: 'Neha', text: 'Excellent explanations and structured playlists.', stars: 4 },
              { name: 'Rahul', text: 'Loved the practice questions and tracking.', stars: 5 },
            ].map((t, idx) => (
              <div key={idx} className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-yellow-500">
                  {'★'.repeat(t.stars)}<span className="text-gray-300">{'★'.repeat(5 - t.stars)}</span>
                </div>
                <p className="mt-3 text-gray-700">“{t.text}”</p>
                <div className="mt-2 text-sm text-gray-500">— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-16">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Start Your Preparation Today</h2>
              <p className="text-white/90 mt-2">Join thousands of learners and boost your exam success.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/register" className="inline-flex items-center rounded-md bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 font-semibold">Sign Up</Link>
              <Link href="/login" className="inline-flex items-center rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 font-semibold">Login</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
