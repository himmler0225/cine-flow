-- =========================================================
-- WATCH PARTY: chạy file này trong Supabase SQL Editor
-- =========================================================

create table if not exists public.watch_rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  host_id uuid references auth.users(id) on delete cascade,
  movie_slug text not null,
  movie_name text,
  thumb_url text,
  episode_name text,
  server_index int default 0,
  playback_time float default 0,
  is_playing boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '6 hours')
);

create table if not exists public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.watch_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

create table if not exists public.room_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.watch_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  content text not null,
  type text default 'message',  -- 'message' | 'system' | 'reaction'
  created_at timestamptz default now()
);

create index if not exists idx_room_messages_room on public.room_messages(room_id, created_at desc);
create index if not exists idx_room_members_room on public.room_members(room_id);
create index if not exists idx_watch_rooms_code on public.watch_rooms(code);

-- RLS
alter table public.watch_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;

drop policy if exists "rooms_select" on public.watch_rooms;
drop policy if exists "rooms_insert" on public.watch_rooms;
drop policy if exists "rooms_update" on public.watch_rooms;
drop policy if exists "members_select" on public.room_members;
drop policy if exists "members_insert" on public.room_members;
drop policy if exists "members_delete" on public.room_members;
drop policy if exists "messages_select" on public.room_messages;
drop policy if exists "messages_insert" on public.room_messages;

create policy "rooms_select" on public.watch_rooms for select using (true);
create policy "rooms_insert" on public.watch_rooms for insert with check (auth.uid() = host_id);
create policy "rooms_update" on public.watch_rooms for update using (auth.uid() = host_id);

create policy "members_select" on public.room_members for select using (true);
create policy "members_insert" on public.room_members for insert with check (auth.uid() = user_id);
create policy "members_delete" on public.room_members for delete using (auth.uid() = user_id);

create policy "messages_select" on public.room_messages for select using (true);
create policy "messages_insert" on public.room_messages for insert with check (auth.uid() = user_id);

-- Realtime publication
alter publication supabase_realtime add table public.room_messages;
alter publication supabase_realtime add table public.watch_rooms;

-- =========================================================
-- MIGRATION: nếu bạn đã chạy SQL cũ có cột playback_seconds
-- Chạy đoạn này để đổi tên cột (bỏ qua nếu bảng chưa tồn tại)
-- =========================================================
-- alter table public.watch_rooms rename column playback_seconds to playback_time;
-- alter table public.watch_rooms drop column if exists episode_index;
-- alter table public.watch_rooms drop column if exists src_m3u8;
-- alter table public.watch_rooms drop column if exists src_embed;
