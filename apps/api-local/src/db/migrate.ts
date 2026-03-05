import 'dotenv/config'
import { sql } from './client.js'

await sql`create extension if not exists "uuid-ossp"`

await sql`
  create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz not null default now()
  )
`

await sql`
  create table if not exists sessions (
    id         uuid primary key default uuid_generate_v4(),
    user_id    uuid not null references users(id) on delete cascade,
    state      text not null default 'CREATED',
    error_code text,
    expires_at timestamptz not null default (now() + interval '24 hours'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`

await sql`
  create table if not exists session_images (
    id          uuid primary key default uuid_generate_v4(),
    session_id  uuid not null references sessions(id) on delete cascade,
    storage_key text not null,
    size_bytes  int not null,
    mime_type   text not null,
    deleted_at  timestamptz,
    created_at  timestamptz not null default now()
  )
`

await sql`
  create table if not exists ingredients (
    id          uuid primary key default uuid_generate_v4(),
    session_id  uuid not null references sessions(id) on delete cascade,
    name        text not null,
    confidence  numeric(4,3),
    source      text not null default 'vision',
    is_active   boolean not null default true,
    created_at  timestamptz not null default now()
  )
`

await sql`
  create table if not exists recipes (
    id                uuid primary key default uuid_generate_v4(),
    session_id        uuid not null references sessions(id) on delete cascade,
    title             text not null,
    description       text not null default '',
    cook_time_minutes int not null,
    difficulty        text not null,
    servings          int not null default 2,
    usage_ratio       numeric(4,3) not null default 0,
    uses              text[] not null default '{}',
    missing           text[] not null default '{}',
    steps             jsonb not null default '[]',
    source            text not null default 'ai',
    created_at        timestamptz not null default now()
  )
`

await sql`
  create table if not exists saved_recipes (
    id        uuid primary key default uuid_generate_v4(),
    user_id   uuid not null references users(id) on delete cascade,
    recipe_id uuid not null references recipes(id) on delete cascade,
    saved_at  timestamptz not null default now(),
    unique (user_id, recipe_id)
  )
`

await sql`
  create table if not exists user_preferences (
    id             uuid primary key default uuid_generate_v4(),
    user_id        uuid not null references users(id) on delete cascade unique,
    cook_time_max  int,
    diet_tags      text[] not null default '{}',
    allergy_tags   text[] not null default '{}',
    cuisine_tags   text[] not null default '{}',
    equipment_tags text[] not null default '{}',
    servings       int not null default 2,
    photo_retention boolean not null default false,
    updated_at     timestamptz not null default now()
  )
`

await sql`
  create table if not exists analytics_events (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid references users(id) on delete set null,
    session_id  uuid references sessions(id) on delete set null,
    event_name  text not null,
    properties  jsonb not null default '{}',
    occurred_at timestamptz not null default now()
  )
`

console.log('✅ Migration complete')
await sql.end()
