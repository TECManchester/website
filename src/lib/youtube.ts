import "server-only";

/**
 * YouTube Data API v3 client for the church channel.
 *
 * QUOTA. The default allowance is 10,000 units/day and it is easy to blow.
 * `search.list` — the obvious way to find a live stream — costs **100 units a
 * call**, so polling it every minute would need 144,000 units/day, fourteen
 * times the budget. Instead we read the channel's uploads playlist, which
 * costs 1 unit, and ask `videos.list` (1 unit) for `liveBroadcastContent`.
 * Live streams appear in the uploads playlist, so this finds them for 2 units
 * per refresh — about 2,900 units/day at a 60s cache. Well inside quota.
 *
 * Everything degrades to null/[] when the key is missing or the API errors, so
 * pages fall back to "watch on YouTube" rather than breaking.
 */

const API = "https://www.googleapis.com/youtube/v3";

/** Handle rather than a hardcoded UC… id, so this survives a channel move. */
export const CHANNEL_HANDLE = "TheElevationChurchManchester";
export const CHANNEL_URL = `https://www.youtube.com/@${CHANNEL_HANDLE}`;

export const isYouTubeConfigured = Boolean(process.env.YOUTUBE_API_KEY);

export type LiveStatus = "live" | "upcoming" | "none";

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string | null;
  /** Null for live streams, which have no fixed duration yet. */
  durationSeconds: number | null;
  liveStatus: LiveStatus;
  /** Set for scheduled premieres and upcoming streams. */
  scheduledStartTime: string | null;
  url: string;
};

type Cache = { revalidate: number; tag: string };

async function api<T>(
  path: string,
  params: Record<string, string>,
  cache: Cache,
): Promise<T | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url, {
      next: { revalidate: cache.revalidate, tags: [cache.tag] },
    });

    if (!res.ok) {
      // 403 here is almost always quota exhaustion or a key restriction.
      const body = await res.text().catch(() => "");
      console.error(
        `YouTube ${path} failed: ${res.status}`,
        body.slice(0, 400),
      );
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`YouTube ${path} threw`, error);
    return null;
  }
}

type ChannelsResponse = {
  items?: {
    id: string;
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }[];
};

/**
 * The uploads playlist id never changes, so this is cached for a day. One unit.
 */
async function getUploadsPlaylistId(): Promise<string | null> {
  const data = await api<ChannelsResponse>(
    "channels",
    { part: "contentDetails", forHandle: `@${CHANNEL_HANDLE}` },
    { revalidate: 86_400, tag: "youtube-channel" },
  );
  return data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

type PlaylistItemsResponse = {
  items?: { contentDetails?: { videoId?: string } }[];
};

type VideosResponse = {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      liveBroadcastContent?: string;
      thumbnails?: Record<string, { url?: string; width?: number }>;
    };
    contentDetails?: { duration?: string };
    liveStreamingDetails?: {
      scheduledStartTime?: string;
      actualEndTime?: string;
    };
  }[];
};

/** ISO 8601 duration (PT1H2M3S) to seconds. */
function parseDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const [, d, h, min, s] = m;
  const total =
    Number(d ?? 0) * 86_400 +
    Number(h ?? 0) * 3_600 +
    Number(min ?? 0) * 60 +
    Number(s ?? 0);
  return total > 0 ? total : null;
}

function pickThumbnail(
  thumbnails: Record<string, { url?: string; width?: number }> | undefined,
): string | null {
  if (!thumbnails) return null;
  // Highest resolution available — next/image resizes down.
  const best = Object.values(thumbnails)
    .filter((t) => t.url)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  return best?.url ?? null;
}

/**
 * Recent uploads, newest first.
 *
 * `revalidate` is short so a live stream is picked up quickly; the cost is only
 * 2 units per refresh.
 */
export async function getRecentVideos(limit = 12): Promise<YouTubeVideo[]> {
  const uploads = await getUploadsPlaylistId();
  if (!uploads) return [];

  const playlist = await api<PlaylistItemsResponse>(
    "playlistItems",
    {
      part: "contentDetails",
      playlistId: uploads,
      maxResults: String(Math.min(limit, 50)),
    },
    { revalidate: 60, tag: "youtube-videos" },
  );

  const ids = (playlist?.items ?? [])
    .map((i) => i.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  const videos = await api<VideosResponse>(
    "videos",
    {
      part: "snippet,contentDetails,liveStreamingDetails",
      id: ids.join(","),
    },
    { revalidate: 60, tag: "youtube-videos" },
  );

  const byId = new Map(
    (videos?.items ?? []).map((item) => {
      const live = item.snippet?.liveBroadcastContent;
      const liveStatus: LiveStatus =
        live === "live" || live === "upcoming" ? live : "none";

      return [
        item.id,
        {
          id: item.id,
          title: item.snippet?.title ?? "Untitled",
          description: item.snippet?.description ?? "",
          publishedAt: item.snippet?.publishedAt ?? "",
          thumbnail: pickThumbnail(item.snippet?.thumbnails),
          durationSeconds: parseDuration(item.contentDetails?.duration),
          liveStatus,
          scheduledStartTime:
            item.liveStreamingDetails?.scheduledStartTime ?? null,
          url: `https://www.youtube.com/watch?v=${item.id}`,
        } satisfies YouTubeVideo,
      ];
    }),
  );

  // videos.list doesn't preserve the id order we asked for.
  return ids.map((id) => byId.get(id)).filter((v): v is YouTubeVideo => !!v);
}

/** The stream that's on air right now, if any. */
export async function getLiveNow(): Promise<YouTubeVideo | null> {
  const videos = await getRecentVideos(10);
  return videos.find((v) => v.liveStatus === "live") ?? null;
}

/** The next scheduled stream or premiere, soonest first. */
export async function getUpcomingStream(): Promise<YouTubeVideo | null> {
  const videos = await getRecentVideos(10);
  const upcoming = videos
    .filter((v) => v.liveStatus === "upcoming" && v.scheduledStartTime)
    .sort(
      (a, b) =>
        Date.parse(a.scheduledStartTime!) - Date.parse(b.scheduledStartTime!),
    );
  return upcoming[0] ?? null;
}

/** Past messages — excludes anything currently live or scheduled. */
export async function getPastMessages(limit = 12): Promise<YouTubeVideo[]> {
  const videos = await getRecentVideos(Math.min(limit + 4, 50));
  return videos.filter((v) => v.liveStatus === "none").slice(0, limit);
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}
