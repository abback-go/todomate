-- ============================================================
-- TodoMate — Supabase schema + seed
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run (idempotent).
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

-- ---------- SEED (demo board) ----------
insert into public.users (id, name, color, initial) values
  ('11111111-1111-1111-1111-111111111111', '지민', '#F472B6', '지'),
  ('22222222-2222-2222-2222-222222222222', '민수', '#60A5FA', '민'),
  ('33333333-3333-3333-3333-333333333333', '서연', '#FB923C', '서'),
  ('44444444-4444-4444-4444-444444444444', '현우', '#34D399', '현')
on conflict (id) do nothing;

insert into public.cards (id, "column", color, title, author_id, assignees, summary_comment, created_at, sort) values
  ('aaaa0000-0000-0000-0000-000000000001', 'todo',  'pink',   '캠페인 아이디어 브레인스토밍', '11111111-1111-1111-1111-111111111111', array['11111111-1111-1111-1111-111111111111']::uuid[], null, now() - interval '2 days',  10),
  ('aaaa0000-0000-0000-0000-000000000002', 'todo',  'yellow', '경쟁사 캠페인 분석',           '22222222-2222-2222-2222-222222222222', array['22222222-2222-2222-2222-222222222222']::uuid[], null, now() - interval '3 days',  20),
  ('aaaa0000-0000-0000-0000-000000000003', 'todo',  'lilac',  '캠페인 KPI 설정',              '33333333-3333-3333-3333-333333333333', array['33333333-3333-3333-3333-333333333333']::uuid[], null, now() - interval '1 days',  30),
  ('aaaa0000-0000-0000-0000-000000000004', 'todo',  'blue',   '예산안 검토 및 승인',          '44444444-4444-4444-4444-444444444444', array['44444444-4444-4444-4444-444444444444']::uuid[], null, now() - interval '4 days',  40),
  ('aaaa0000-0000-0000-0000-000000000005', 'doing', 'lemon',  '캠페인 콘텐츠 기획',           '33333333-3333-3333-3333-333333333333', array['33333333-3333-3333-3333-333333333333']::uuid[], null, now() - interval '5 days',  50),
  ('aaaa0000-0000-0000-0000-000000000006', 'doing', 'peach',  'SNS 채널별 콘텐츠 초안 작성',  '44444444-4444-4444-4444-444444444444', array['44444444-4444-4444-4444-444444444444']::uuid[], null, now() - interval '3 days',  60),
  ('aaaa0000-0000-0000-0000-000000000007', 'doing', 'yellow', '랜딩 페이지 와이어프레임',     '22222222-2222-2222-2222-222222222222', array['22222222-2222-2222-2222-222222222222']::uuid[], null, now() - interval '2 days',  70),
  ('aaaa0000-0000-0000-0000-000000000008', 'done',  'mint',   '타겟 고객 페르소나 정의',      '11111111-1111-1111-1111-111111111111', array['11111111-1111-1111-1111-111111111111']::uuid[], null, now() - interval '8 days',  80),
  ('aaaa0000-0000-0000-0000-000000000009', 'done',  'lilac',  '프로젝트 일정 계획 수립',      '44444444-4444-4444-4444-444444444444', array['44444444-4444-4444-4444-444444444444']::uuid[], null, now() - interval '10 days', 90),
  ('aaaa0000-0000-0000-0000-000000000010', 'done',  'pink',   '팀 킥오프 미팅',               null, array['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444']::uuid[], '모두: 킥오프 미팅 완료! 다음 단계 진행해요.', now() - interval '12 days', 100)
on conflict (id) do nothing;

insert into public.comments (card_id, author_id, text, created_at) values
  ('aaaa0000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '타겟 고객을 더 구체화해보면 좋겠어요!', now() - interval '5 hours'),
  ('aaaa0000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '30대 직장인 중심으로 정리해볼게요.',   now() - interval '2 hours'),
  ('aaaa0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '특히 SNS 채널 위주로 분석 부탁해요.',  now() - interval '8 hours'),
  ('aaaa0000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '예산 항목별로 한 번 더 확인해주세요.', now() - interval '12 hours'),
  ('aaaa0000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', '이미지 컨셉 좋네요! 👍',              now() - interval '3 hours'),
  ('aaaa0000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '카피 문구도 아이디어 공유할게요.',     now() - interval '1 hours'),
  ('aaaa0000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', '키워드 미리 정리해두면 어떨까요?',     now() - interval '40 minutes'),
  ('aaaa0000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', '인스타그램용은 1:1 비율로 부탁해요!',  now() - interval '6 hours'),
  ('aaaa0000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', '해시태그 제안도 함께 정리해둘게요.',   now() - interval '2 hours'),
  ('aaaa0000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'CTA 버튼 문구 고민해보겠습니다.',      now() - interval '4 hours'),
  ('aaaa0000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', '페르소나 정리 잘 됐어요! 👍',         now() - interval '1 days'),
  ('aaaa0000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', '다음 단계로 진행해도 좋을 것 같아요.', now() - interval '1 days'),
  ('aaaa0000-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', '전체 일정 공유 감사합니다!',           now() - interval '2 days');
