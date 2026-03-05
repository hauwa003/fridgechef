-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
create table users (
  id            uuid primary key default uuid_generate_v4(),
  anonymous_id  text unique,                    -- device-generated UUID for anon users
  provider      text,                           -- 'apple' | 'google' | null
  provider_id   text,                           -- provider's user id
  email         text,
  photo_retention boolean not null default false, -- false = delete after extraction
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (provider, provider_id)
);

-- ─────────────────────────────────────────────
-- USER PREFERENCES
-- ─────────────────────────────────────────────
create table user_preferences (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  cook_time_max   int,                          -- minutes
  diet_tags       text[] not null default '{}',
  allergy_tags    text[] not null default '{}',
  cuisine_tags    text[] not null default '{}',
  equipment_tags  text[] not null default '{}',
  servings        int not null default 2,
  units           text not null default 'metric', -- 'metric' | 'imperial'
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

-- ─────────────────────────────────────────────
-- SESSIONS
-- ─────────────────────────────────────────────
create type session_state as enum (
  'CREATED',
  'IMAGES_UPLOADED',
  'EXTRACTING',
  'EXTRACTED',
  'GENERATING_RECIPES',
  'RECIPES_READY',
  'FAILED'
);

create table sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  state       session_state not null default 'CREATED',
  error_code  text,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index sessions_user_id_idx on sessions(user_id);
create index sessions_state_idx on sessions(state);

-- ─────────────────────────────────────────────
-- SESSION IMAGES
-- ─────────────────────────────────────────────
create table session_images (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references sessions(id) on delete cascade,
  storage_key  text not null,
  size_bytes   int not null,
  mime_type    text not null,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index session_images_session_id_idx on session_images(session_id);

-- ─────────────────────────────────────────────
-- INGREDIENTS
-- ─────────────────────────────────────────────
create type ingredient_source as enum ('vision', 'manual');

create table ingredients (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references sessions(id) on delete cascade,
  name        text not null,
  confidence  numeric(4,3),                    -- null for manual entries
  source      ingredient_source not null,
  is_active   boolean not null default true,   -- false = user removed it
  created_at  timestamptz not null default now()
);

create index ingredients_session_id_idx on ingredients(session_id);

-- ─────────────────────────────────────────────
-- RECIPES
-- ─────────────────────────────────────────────
create type recipe_source as enum ('ai', 'fallback');

create table recipes (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references sessions(id) on delete cascade,
  title               text not null,
  description         text not null default '',
  cook_time_minutes   int not null,
  difficulty          text not null,           -- 'easy' | 'medium' | 'hard'
  servings            int not null default 2,
  usage_ratio         numeric(4,3) not null,
  uses                text[] not null default '{}',
  missing             text[] not null default '{}',
  steps               jsonb not null default '[]',
  source              recipe_source not null default 'ai',
  created_at          timestamptz not null default now()
);

create index recipes_session_id_idx on recipes(session_id);

-- ─────────────────────────────────────────────
-- SAVED RECIPES
-- ─────────────────────────────────────────────
create table saved_recipes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  recipe_id   uuid not null references recipes(id) on delete cascade,
  saved_at    timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index saved_recipes_user_id_idx on saved_recipes(user_id);

-- ─────────────────────────────────────────────
-- ANALYTICS EVENTS
-- ─────────────────────────────────────────────
create table analytics_events (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references users(id) on delete set null,
  session_id   uuid references sessions(id) on delete set null,
  event_name   text not null,
  properties   jsonb not null default '{}',
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index analytics_events_user_id_idx on analytics_events(user_id);
create index analytics_events_event_name_idx on analytics_events(event_name);
create index analytics_events_occurred_at_idx on analytics_events(occurred_at);

-- ─────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
  for each row execute function set_updated_at();

create trigger sessions_updated_at before update on sessions
  for each row execute function set_updated_at();

create trigger preferences_updated_at before update on user_preferences
  for each row execute function set_updated_at();
