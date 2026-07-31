

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

DO $$ BEGIN
  ALTER TABLE public.comments
    ADD CONSTRAINT comments_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
