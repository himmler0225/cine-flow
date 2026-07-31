export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  plan: string | null;
  role: string | null;
}

export interface Comment {
  id: string;
  user_id: string;
  movie_slug: string;
  content: string;
  username: string | null;
  avatar_url: string | null;
  likes: number | null;
  is_spoiler?: boolean | null;
  episode_name?: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  movie_slug: string;
  movie_name: string;
  thumb_url: string | null;
  created_at?: string;
}

export interface FavoriteSlug {
  id: string;
  movie_slug: string;
}

export interface InsertCommentInput {
  userId: string;
  movieSlug: string;
  content: string;
  isSpoiler?: boolean;
  episodeName?: string | null;
}

export interface MovieRatingAggregate {
  average: number;
  count: number;
}

export interface InsertFavoriteInput {
  userId: string;
  movieSlug: string;
  movieName: string;
  thumbUrl: string | null;
}
