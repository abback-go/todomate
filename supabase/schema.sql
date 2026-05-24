-- ============================================================
-- TodoMate — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run (idempotent). Starts with an empty board (no seed data).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- TABLES ----------
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null,
  initial    text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id              uuid primary key default gen_random_uuid(),
  "column"        text not null check ("column" in ('todo','doing','done')),
  color           text not null default 'yellow',
  title           text not null,
  author_id       uuid references public.users(id) on delete set null,
  assignees       uuid[] not null default '{}',
  summary_comment text,
  created_at      timestamptz not null default now(),
  sort            bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  author_id  uuid references public.users(id) on delete set null,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_card_id_idx on public.comments(card_id);
create index if not exists cards_column_idx     on public.cards("column");
create index if not exists cards_sort_idx       on public.cards(sort);

-- ---------- ROW LEVEL SECURITY ----------
-- No login (anon key only), so allow the anon/authenticated roles full access.
-- NOTE: this means anyone holding the anon key can read/write the board.
-- Fine for a shared team demo; add auth + stricter policies for production.
alter table public.users    enable row level security;
alter table public.cards    enable row level security;
alter table public.comments enable row level security;

drop policy if exists "todomate_users_all"    on public.users;
drop policy if exists "todomate_cards_all"     on public.cards;
drop policy if exists "todomate_comments_all"  on public.comments;

create policy "todomate_users_all"    on public.users    for all to anon, authenticated using (true) with check (true);
create policy "todomate_cards_all"     on public.cards     for all to anon, authenticated using (true) with check (true);
create policy "todomate_comments_all"  on public.comments  for all to anon, authenticated using (true) with check (true);

-- ---------- REALTIME ----------
do $$
begin
  begin alter publication supabase_realtime add table public.users;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.cards;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
end $$;
