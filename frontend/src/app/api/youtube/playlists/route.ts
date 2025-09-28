import { NextRequest } from 'next/server'

type PlaylistThumbs = {
	default?: { url: string; width: number; height: number }
	medium?: { url: string; width: number; height: number }
	high?: { url: string; width: number; height: number }
	standard?: { url: string; width: number; height: number }
	maxres?: { url: string; width: number; height: number }
}

type YouTubePlaylistItem = {
	id: string
	snippet?: {
		title?: string
		description?: string
		thumbnails?: PlaylistThumbs
	}
	contentDetails?: {
		itemCount?: number
	}
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	try {
			const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
		if (!apiKey) {
			return new Response(
					JSON.stringify({ error: 'Server missing YOUTUBE_API_KEY (or NEXT_PUBLIC_YOUTUBE_API_KEY)' }),
				{ status: 500, headers: { 'content-type': 'application/json' } }
			)
		}

		const { searchParams } = new URL(req.url)
		const idsParam = (searchParams.get('ids') || '').trim()
		const channelId = (searchParams.get('channelId') || '').trim()

		if (!idsParam && !channelId) {
			return new Response(
				JSON.stringify({ error: 'Provide ids (comma-separated) or channelId' }),
				{ status: 400, headers: { 'content-type': 'application/json' } }
			)
		}

		const base = 'https://www.googleapis.com/youtube/v3/playlists'
		const query = new URLSearchParams()
		query.set('part', 'snippet,contentDetails')
		query.set('maxResults', '50')
		query.set('key', apiKey)
		if (idsParam) query.set('id', idsParam)
		if (channelId && !idsParam) query.set('channelId', channelId)

		const url = `${base}?${query.toString()}`

		const ytRes = await fetch(url, { next: { revalidate: 3600 }, headers: { accept: 'application/json' } })
			if (!ytRes.ok) {
				let text: any
				try {
					text = await ytRes.json()
				} catch {
					text = await ytRes.text()
				}
			return new Response(
				JSON.stringify({ error: 'YouTube API error', status: ytRes.status, body: text }),
				{ status: 502, headers: { 'content-type': 'application/json' } }
			)
		}

		const data = (await ytRes.json()) as { items?: YouTubePlaylistItem[] }
			const items = (data.items || []).map((p) => {
			const thumbs = p.snippet?.thumbnails
			const thumbUrl =
				thumbs?.maxres?.url ||
				thumbs?.standard?.url ||
				thumbs?.high?.url ||
				thumbs?.medium?.url ||
				thumbs?.default?.url ||
				''
			return {
				id: p.id,
				title: p.snippet?.title || 'Untitled Playlist',
				description: p.snippet?.description || '',
				thumbnail: thumbUrl,
				itemCount: p.contentDetails?.itemCount ?? null,
				url: `https://www.youtube.com/playlist?list=${p.id}`,
			}
		})

		return new Response(JSON.stringify({ items }), {
			status: 200,
			headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300, s-maxage=300' },
		})
	} catch (err: any) {
		return new Response(
			JSON.stringify({ error: 'Unexpected error', message: err?.message || String(err) }),
			{ status: 500, headers: { 'content-type': 'application/json' } }
		)
	}
}

