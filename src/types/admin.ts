export interface AdminProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  plan: string | null;
  created_at: string;
  email?: string | null;
}

export interface AdminRoomRow {
  id: string;
  code: string;
  host_id: string;
  movie_name: string | null;
  movie_slug: string;
  created_at: string;
  expires_at: string;
}

export interface MovieAgg {
  slug: string;
  name: string;
  thumb: string | null;
  views: number;
  uniqueViewers: number;
  avgTime: number;
  completion: number;
  lastWatched: string;
}

export function pctChange(curr: number, prev: number): number {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}
