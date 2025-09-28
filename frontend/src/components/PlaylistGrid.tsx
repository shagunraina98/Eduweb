"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type Playlist = {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  itemCount?: number | null;
  url: string;
}

type Props = {
  playlistIds?: string[]; // Optional: if provided, fetch by ids; otherwise rely on channelId
  channelId?: string; // Optional alternative
  className?: string;
  heading?: string;
  subheading?: string;
}

export default function PlaylistGrid({ playlistIds, channelId, className, heading = 'Popular Courses', subheading = 'YouTube playlists curated for exam success.' }: Props) {
  const [items, setItems] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (playlistIds && playlistIds.length) q.set('ids', playlistIds.join(','));
    else if (channelId) q.set('channelId', channelId);
    return q.toString();
  }, [playlistIds, channelId]);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/youtube/playlists${query ? `?${query}` : ''}`, { headers: { 'x-requested-with': 'PlaylistGrid' } });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as { items?: Playlist[] };
        if (!isMounted) return;
        setItems(data.items || []);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load playlists');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    run();
    return () => { isMounted = false; };
  }, [query]);

  return (
    <section className={className}>
      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">{heading}</h2>
      {subheading && <p className="text-gray-600 mt-2">{subheading}</p>}
      {loading && (
        <div className="mt-6 text-gray-500">Loading playlists…</div>
      )}
      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      )}
      {!loading && !error && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 && (
            <div className="text-gray-500">No playlists found.</div>
          )}
          {items.map((course) => (
            <div key={course.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="relative h-40 w-full bg-gray-100">
                {course.thumbnail ? (
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">No image</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-blue-800 line-clamp-2">{course.title}</h3>
                {course.itemCount != null && (
                  <div className="mt-1 text-xs text-gray-500">{course.itemCount} videos</div>
                )}
                {course.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{course.description}</p>
                )}
                <a
                  href={course.url}
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
      )}
    </section>
  );
}
