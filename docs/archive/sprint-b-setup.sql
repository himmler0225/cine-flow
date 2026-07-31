

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS episode_name text;

CREATE INDEX IF NOT EXISTS comments_movie_episode_idx
  ON public.comments (movie_slug, episode_name);

CREATE TABLE IF NOT EXISTS public.movie_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_slug text NOT NULL,
  score smallint NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_slug)
);

CREATE INDEX IF NOT EXISTS movie_ratings_slug_idx ON public.movie_ratings (movie_slug);

ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movie_ratings_select" ON public.movie_ratings
  FOR SELECT USING (true);

CREATE POLICY "movie_ratings_insert" ON public.movie_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "movie_ratings_update" ON public.movie_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "movie_ratings_delete" ON public.movie_ratings
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
