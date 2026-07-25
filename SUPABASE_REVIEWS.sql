-- Run this once in Supabase Dashboard -> SQL Editor.
-- Reevu reviews are first-party data and do not depend on TMDB reviews.

create table if not exists public.reevu_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null,
  movie_title text not null,
  poster_path text,
  rating smallint not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 10 and 2000),
  author_name text not null,
  author_avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create index if not exists reevu_reviews_movie_id_idx
  on public.reevu_reviews (movie_id, updated_at desc);

alter table public.reevu_reviews enable row level security;

drop policy if exists "Reviews are publicly readable" on public.reevu_reviews;
create policy "Reviews are publicly readable"
  on public.reevu_reviews for select
  using (true);

drop policy if exists "Users create their own reviews" on public.reevu_reviews;
create policy "Users create their own reviews"
  on public.reevu_reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own reviews" on public.reevu_reviews;
create policy "Users update their own reviews"
  on public.reevu_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete their own reviews" on public.reevu_reviews;
create policy "Users delete their own reviews"
  on public.reevu_reviews for delete
  using (auth.uid() = user_id);
