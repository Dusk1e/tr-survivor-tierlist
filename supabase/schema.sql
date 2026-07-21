-- =====================================================================
--  TR - SURVİVOR TİERLİST — Supabase şeması (v2)
--  Supabase projenin SQL Editor'üne yapıştır ve RUN de.
--  Eski (v1) tabloların varsa önce onları silmen gerekir:
--    drop table if exists public.votes; drop table if exists public.mice;
--    drop table if exists public.authorities;
-- =====================================================================

-- Fareler ---------------------------------------------------------------
create table if not exists public.mice (
  id          uuid primary key default gen_random_uuid(),
  nickname    text not null,
  title       text not null default '',
  image_url   text not null default '',
  -- monarch | monarch_s | s | s_a | a | a_b | b | b_c | c | c_de | de
  tier        text not null default 'de',
  sort        integer not null default 0,
  username    text not null default '',
  password    text not null default '',
  -- tier_edit | pw_view | pw_edit | mouse_add | vote_approve | vote_log
  permissions text[] not null default '{}',
  -- şifre/yetki değişince +1 → o farenin tüm oturumları düşer
  epoch       integer not null default 0,
  -- Ask Kosesi: esinin id'si. Karsiliklidir.
  partner_id  uuid references public.mice(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists mice_tier_sort_idx on public.mice (tier, sort);

-- Puanlamalar ------------------------------------------------------------
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    uuid not null references public.mice (id) on delete cascade,
  voter_nick  text not null default '',
  target_id   uuid not null references public.mice (id) on delete cascade,
  target_nick text not null default '',
  fare_play   integer not null default 50,
  saman_play  integer not null default 50,
  ws_guven    integer not null default 50,
  hotkey      boolean not null default false,
  -- pending | approved | rejected  (sadece approved ortalamaya işlenir)
  status      text not null default 'pending',
  decided_at  timestamptz,
  decided_by  text,
  created_at  timestamptz not null default now(),
  unique (voter_id, target_id)
);

create index if not exists votes_status_idx on public.votes (status);
create index if not exists votes_target_idx on public.votes (target_id);

-- Site altındaki yetkili isim listesi -------------------------------------
create table if not exists public.authorities (
  name text primary key
);

insert into public.authorities (name)
values ('Alwesh'), ('Blacklean')
on conflict do nothing;

-- =====================================================================
--  GÜVENLİK: RLS açık, HİÇBİR public policy yok.
--  Tüm erişim Next.js API'si üzerinden SERVICE ROLE ile yapılır;
--  anon key ile şifreler dahil hiçbir tabloya doğrudan erişilemez.
-- =====================================================================
alter table public.mice enable row level security;
alter table public.votes enable row level security;
alter table public.authorities enable row level security;

-- =====================================================================
--  MEVCUT KURULUMA EKLEME (Ask Kosesi)
--  Veritabani zaten kuruluysa sadece su satiri calistir:
-- =====================================================================
alter table public.mice
  add column if not exists partner_id uuid references public.mice(id) on delete set null;
