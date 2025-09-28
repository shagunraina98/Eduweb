"use client";
import Link from 'next/link';
import Image from 'next/image';
import PlaylistGrid from '@/components/PlaylistGrid';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-10">
        <h1 className="text-3xl font-bold text-blue-900">Welcome back 👋</h1>
        <p className="text-gray-600 mt-2">Jump into your preparation with curated courses and resources.</p>
      </section>

      {/* Popular Courses */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-8">
          <PlaylistGrid
            heading="Popular Courses"
            subheading="YouTube playlists curated for exam success."
            playlistIds={[
              'PLloYqMn5Mvwv11BPq3WQuWSTYBaZFF09r',
              'PLloYqMn5MvwsommDJfRpOXiQAv0cwzd9R',
              'PLloYqMn5MvwvsB4ZSQyHPdt-PlvA9_Qeq',
              'PLloYqMn5MvwsOtKYCZ3-Awk0IFQCeFjnC',
              'PLloYqMn5MvwuG5sCQg3oz9siBowf7fzd3',
              'PLloYqMn5Mvwv6D8Hzer2AGBJolYukIfDr',
            ]}
          />
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
    </main>
  );
}
