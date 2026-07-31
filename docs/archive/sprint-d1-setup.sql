

CREATE TABLE IF NOT EXISTS public.user_watchlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_key text NOT NULL,
  name text NOT NULL,
  slugs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, list_key)
);

CREATE INDEX IF NOT EXISTS user_watchlists_user_idx ON public.user_watchlists (user_id);

ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_watchlists_select" ON public.user_watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_watchlists_insert" ON public.user_watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_watchlists_update" ON public.user_watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_watchlists_delete" ON public.user_watchlists
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
