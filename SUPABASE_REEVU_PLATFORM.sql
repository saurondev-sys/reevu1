-- Reevu-owned platform data.
-- Run once in Supabase Dashboard -> SQL Editor after the profile/review scripts.

create table if not exists public.reevu_catalog_cache (
  cache_key text primary key,
  resource text not null check (
    resource in ('home', 'category', 'search', 'movie', 'person')
  ),
  payload jsonb not null,
  source text not null default 'tmdb',
  source_updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reevu_catalog_cache_expiry_idx
  on public.reevu_catalog_cache (expires_at);

alter table public.reevu_catalog_cache enable row level security;

drop policy if exists "Catalog cache is publicly readable"
  on public.reevu_catalog_cache;
create policy "Catalog cache is publicly readable"
  on public.reevu_catalog_cache for select
  using (true);

-- There are intentionally no browser write policies for the catalog cache.
-- Only the server-side Supabase secret/service-role key may refresh it.

create table if not exists public.reevu_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('favorite', 'watchlist')),
  movie_id bigint not null,
  movie_title text not null,
  overview text not null default '',
  poster_path text,
  backdrop_path text,
  release_date text not null default '',
  vote_average double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, movie_id)
);

create index if not exists reevu_library_user_kind_idx
  on public.reevu_library (user_id, kind, updated_at desc);

alter table public.reevu_library enable row level security;

drop policy if exists "Users read their own library" on public.reevu_library;
create policy "Users read their own library"
  on public.reevu_library for select
  using (auth.uid() = user_id);

drop policy if exists "Users add to their own library" on public.reevu_library;
create policy "Users add to their own library"
  on public.reevu_library for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own library" on public.reevu_library;
create policy "Users update their own library"
  on public.reevu_library for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users remove from their own library" on public.reevu_library;
create policy "Users remove from their own library"
  on public.reevu_library for delete
  using (auth.uid() = user_id);

create or replace function public.set_reevu_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reevu_library_updated_at on public.reevu_library;
create trigger set_reevu_library_updated_at
before update on public.reevu_library
for each row execute function public.set_reevu_updated_at();

drop trigger if exists set_reevu_catalog_cache_updated_at
  on public.reevu_catalog_cache;
create trigger set_reevu_catalog_cache_updated_at
before update on public.reevu_catalog_cache
for each row execute function public.set_reevu_updated_at();
