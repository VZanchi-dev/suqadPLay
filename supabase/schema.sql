-- ============================================================
--  SquadPlay — Schéma de base de données Supabase
--  À coller dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Types ENUM ──────────────────────────────────────────────
create type game_category as enum (
  'FPS', 'MOBA', 'Stratégie', 'Battle Royale', 'RPG', 'Sport', 'MMO', 'Simulation'
);

create type player_level as enum (
  'Débutant', 'Intermédiaire', 'Confirmé', 'Expert'
);

create type age_range as enum (
  '13-17 ans', '18-25 ans', '26-35 ans', '35+ ans'
);

create type session_status as enum (
  'open', 'full', 'closed'
);

-- ─── Table : games ───────────────────────────────────────────
create table public.games (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  emoji       text not null default '🎮',
  category    game_category not null,
  created_at  timestamptz default now()
);

-- ─── Table : profiles ────────────────────────────────────────
-- Liée à auth.users de Supabase Auth
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text not null unique,
  avatar_emoji     text not null default '🎮',
  avatar_url       text,
  level            player_level not null default 'Débutant',
  age_range        age_range not null default '18-25 ans',
  languages        text[] not null default array['Français'],
  discord_username text,
  bio              text,
  created_at       timestamptz default now()
);

-- ─── Table : sessions ─────────────────────────────────────────
create table public.sessions (
  id               uuid primary key default uuid_generate_v4(),
  host_id          uuid not null references public.profiles(id) on delete cascade,
  game_id          uuid not null references public.games(id),
  description      text not null default '',
  level_required   player_level not null default 'Débutant',
  age_range        age_range not null default '18-25 ans',
  languages        text[] not null default array['Français'],
  discord_required boolean not null default false,
  discord_invite   text check (discord_invite is null or discord_invite ~ '^https://discord\.gg/[A-Za-z0-9_-]{2,32}$'),
  teamspeak_ip     text check (teamspeak_ip is null or teamspeak_ip ~ '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d{1,5})?$'),
  players_max      int not null default 5 check (players_max between 2 and 20),
  status           session_status not null default 'open',
  created_at       timestamptz default now()
);

-- ─── Table : session_players ──────────────────────────────────
create table public.session_players (
  session_id  uuid references public.sessions(id) on delete cascade,
  player_id   uuid references public.profiles(id) on delete cascade,
  joined_at   timestamptz default now(),
  primary key (session_id, player_id)
);

-- ─── Vue : sessions enrichies ────────────────────────────────
create or replace view public.sessions_view as
select
  s.*,
  g.name        as game_name,
  g.emoji       as game_emoji,
  g.category    as game_category,
  p.username    as host_username,
  p.avatar_emoji as host_avatar,
  count(sp.player_id)::int as players_count
from public.sessions s
join public.games    g  on g.id = s.game_id
join public.profiles p  on p.id = s.host_id
left join public.session_players sp on sp.session_id = s.id
group by s.id, g.id, p.id;

-- ─── Fonction : mise à jour status auto ───────────────────────
create or replace function update_session_status()
returns trigger as $$
declare
  current_count int;
  max_players   int;
begin
  select count(*), s.players_max
  into current_count, max_players
  from public.session_players sp
  join public.sessions s on s.id = sp.session_id
  where sp.session_id = coalesce(new.session_id, old.session_id)
  group by s.players_max;

  update public.sessions
  set status = case
    when current_count >= max_players then 'full'
    else 'open'
  end
  where id = coalesce(new.session_id, old.session_id);

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_session_status
after insert or delete on public.session_players
for each row execute function update_session_status();

-- ─── Fonction : profil auto à l'inscription ──────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_emoji', '🎮')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_new_user
after insert on auth.users
for each row execute function handle_new_user();

-- ─── Row Level Security (RLS) ─────────────────────────────────
alter table public.games           enable row level security;
alter table public.profiles        enable row level security;
alter table public.sessions        enable row level security;
alter table public.session_players enable row level security;

-- games : lecture publique
create policy "games_select_public" on public.games
  for select using (true);

-- profiles : lecture publique, modif par le propriétaire
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- sessions : lecture publique, création par authentifiés, modif par l'hôte
create policy "sessions_select_public" on public.sessions
  for select using (true);
create policy "sessions_insert_auth" on public.sessions
  for insert with check (auth.uid() = host_id);
create policy "sessions_update_host" on public.sessions
  for update using (auth.uid() = host_id);
create policy "sessions_delete_host" on public.sessions
  for delete using (auth.uid() = host_id);

-- session_players : lecture publique, rejoindre par soi-même
create policy "session_players_select_public" on public.session_players
  for select using (true);
create policy "session_players_insert_self" on public.session_players
  for insert with check (auth.uid() = player_id);
create policy "session_players_delete_self" on public.session_players
  for delete using (auth.uid() = player_id);

-- ─── Données de départ (jeux) ────────────────────────────────
insert into public.games (name, emoji, category) values
  ('Valorant',          '🎯', 'FPS'),
  ('CS2',               '💣', 'FPS'),
  ('Apex Legends',      '🦾', 'Battle Royale'),
  ('Fortnite',          '🏗️', 'Battle Royale'),
  ('League of Legends', '⚔️', 'MOBA'),
  ('Dota 2',            '🧙', 'MOBA'),
  ('Rocket League',     '🚀', 'Sport'),
  ('FIFA 25',           '⚽', 'Sport'),
  ('Age of Empires IV', '🏰', 'Stratégie'),
  ('Civilization VI',   '🌍', 'Stratégie'),
  ('World of Warcraft', '🐉', 'MMO'),
  ('Warframe',          '🤖', 'RPG');

-- ─── Table : comments ────────────────────────────────────────
create table public.comments (
  id         uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "comments_select_public" on public.comments
  for select using (true);
create policy "comments_insert_auth" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);

-- ─── Realtime : activer les tables ───────────────────────────
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.session_players;
alter publication supabase_realtime add table public.comments;
