-- Run this once in Supabase SQL Editor to fix missing columns.
-- Errors fixed:
--   * "Could not find the 'thumb_url' column of 'watch_history' in the schema cache"
--   * "Could not find the 'episode_index' column of 'watch_history' in the schema cache"
--   * "column favorites.created_at does not exist"

ALTER TABLE public.watch_history
  ADD COLUMN IF NOT EXISTS thumb_url text;

ALTER TABLE public.watch_history
  ADD COLUMN IF NOT EXISTS episode_index integer;

ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS is_spoiler boolean NOT NULL DEFAULT false;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS episode_name text;

-- username/avatar_url live on profiles (fetched in a second query), not on comments.

-- Optional: FK so PostgREST can embed profiles(...) in one query later
DO $$ BEGIN
  ALTER TABLE public.comments
    ADD CONSTRAINT comments_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
