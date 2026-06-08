-- Feedback table
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  rating     int check (rating between 1 and 5),
  category   text,
  message    text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Anyone authenticated (or anonymous) can insert — never block a user on feedback
create policy "feedback insert" on public.feedback
  for insert with check (true);

-- Only service role can read (for admin insights)
create policy "feedback service read" on public.feedback
  for select using (false);
