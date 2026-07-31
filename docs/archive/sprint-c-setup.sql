

ALTER TABLE public.watch_rooms
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.watch_rooms
  ADD COLUMN IF NOT EXISTS pin text;

NOTIFY pgrst, 'reload schema';
