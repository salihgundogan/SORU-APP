-- Ayet / Şiir Ezber Uygulaması — başlangıç şeması
-- Supabase SQL Editor'de bu dosyanın tamamını çalıştır.

create extension if not exists "pgcrypto";

create table if not exists folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id         uuid primary key default gen_random_uuid(),
  folder_id  uuid not null references folders(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id         uuid primary key default gen_random_uuid(),
  exam_id    uuid not null references exams(id) on delete cascade,
  parcalar   jsonb not null,
  nukte      text not null,
  created_at timestamptz not null default now()
);

create table if not exists attempts (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  session_id  uuid not null,
  metin_sonuc text not null check (metin_sonuc in ('bildim', 'bilemedim')),
  nukte_sonuc text not null check (nukte_sonuc in ('bildim', 'bilemedim')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_exams_folder_id on exams(folder_id);
create index if not exists idx_questions_exam_id on questions(exam_id);
create index if not exists idx_attempts_question_id on attempts(question_id);

-- v1: auth yok, tek kullanıcı — anon anahtarla tam erişim veren açık RLS politikaları.
alter table folders enable row level security;
alter table exams enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;

create policy "anon tam erisim" on folders   for all using (true) with check (true);
create policy "anon tam erisim" on exams     for all using (true) with check (true);
create policy "anon tam erisim" on questions for all using (true) with check (true);
create policy "anon tam erisim" on attempts  for all using (true) with check (true);
