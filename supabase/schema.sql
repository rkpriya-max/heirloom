-- ============================================================
-- HEIRLOOM — Full Database Schema
-- Paste this entire file into Supabase SQL Editor and run.
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── RECIPES ─────────────────────────────────────────────────
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  yield text,
  cook_time text,
  image_url text,
  original_image_base64 text,   -- preserved handwriting image
  is_public boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  section text,                  -- null = no header
  items text[] not null default '{}',
  sort_order int default 0
);

create table if not exists recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  content text not null,
  sort_order int default 0
);

create table if not exists recipe_tags (
  recipe_id uuid references recipes(id) on delete cascade,
  tag text not null,
  primary key (recipe_id, tag)
);

-- ── RECIPE VERSIONS ─────────────────────────────────────────
create table if not exists recipe_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  author_id uuid references profiles(id),
  label text not null,
  notes text,
  ingredients jsonb,
  steps jsonb,
  created_at timestamptz default now()
);

-- ── COMMENTS & MEMORIES ─────────────────────────────────────
create table if not exists recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists recipe_memories (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  tagged_people text[] default '{}',
  created_at timestamptz default now()
);

-- ── AI DIGITIZATION LOG ─────────────────────────────────────
create table if not exists digitize_corrections (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  field_name text,
  original_value text,
  corrected_value text,
  confidence_score numeric,
  created_at timestamptz default now()
);

-- ── FAMILIES ────────────────────────────────────────────────
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists family_members (
  family_id uuid references families(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  primary key (family_id, user_id)
);

create table if not exists family_recipes (
  family_id uuid references families(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete cascade,
  shared_by uuid references profiles(id),
  shared_at timestamptz default now(),
  primary key (family_id, recipe_id)
);

create table if not exists family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  invited_email text not null,
  invited_by uuid references profiles(id),
  token text unique default gen_random_uuid()::text,
  accepted boolean default false,
  created_at timestamptz default now()
);

-- ── EVENTS ──────────────────────────────────────────────────
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  host_id uuid references profiles(id) on delete cascade not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists event_guests (
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (event_id, user_id)
);

create table if not exists event_recipes (
  event_id uuid references events(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete cascade,
  sort_order int default 0,
  primary key (event_id, recipe_id)
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
alter table profiles enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps enable row level security;
alter table recipe_tags enable row level security;
alter table recipe_versions enable row level security;
alter table recipe_comments enable row level security;
alter table recipe_memories enable row level security;
alter table digitize_corrections enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table family_recipes enable row level security;
alter table family_invites enable row level security;
alter table events enable row level security;
alter table event_guests enable row level security;
alter table event_recipes enable row level security;

-- Profiles: own row + family members of same families can read
create policy "profiles_read_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Recipes: owner full access, public recipes readable by all, family-shared readable by members
create policy "recipes_owner" on recipes for all using (auth.uid() = user_id);
create policy "recipes_public_read" on recipes for select using (is_public = true);
create policy "recipes_family_read" on recipes for select using (
  exists (
    select 1 from family_recipes fr
    join family_members fm on fr.family_id = fm.family_id
    where fr.recipe_id = recipes.id and fm.user_id = auth.uid()
  )
);

-- Ingredients/steps/tags: follow recipe access
create policy "ingredients_owner" on recipe_ingredients for all using (
  exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
);
create policy "ingredients_read_shared" on recipe_ingredients for select using (
  exists (select 1 from recipes where id = recipe_id and is_public = true)
  or exists (
    select 1 from recipes r
    join family_recipes fr on r.id = fr.recipe_id
    join family_members fm on fr.family_id = fm.family_id
    where r.id = recipe_id and fm.user_id = auth.uid()
  )
);

create policy "steps_owner" on recipe_steps for all using (
  exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
);
create policy "steps_read_shared" on recipe_steps for select using (
  exists (select 1 from recipes where id = recipe_id and is_public = true)
  or exists (
    select 1 from recipes r
    join family_recipes fr on r.id = fr.recipe_id
    join family_members fm on fr.family_id = fm.family_id
    where r.id = recipe_id and fm.user_id = auth.uid()
  )
);

create policy "tags_owner" on recipe_tags for all using (
  exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
);

-- Versions: owner + family members
create policy "versions_owner" on recipe_versions for all using (auth.uid() = author_id);
create policy "versions_family_read" on recipe_versions for select using (
  exists (
    select 1 from recipes r
    join family_recipes fr on r.id = fr.recipe_id
    join family_members fm on fr.family_id = fm.family_id
    where r.id = recipe_id and fm.user_id = auth.uid()
  )
);

-- Comments & memories: family members can read + insert, owner can delete
create policy "comments_insert" on recipe_comments for insert with check (auth.uid() = user_id);
create policy "comments_read" on recipe_comments for select using (
  exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
  or exists (select 1 from recipes where id = recipe_id and is_public = true)
  or exists (
    select 1 from family_recipes fr
    join family_members fm on fr.family_id = fm.family_id
    where fr.recipe_id = recipe_id and fm.user_id = auth.uid()
  )
);
create policy "comments_delete_own" on recipe_comments for delete using (auth.uid() = user_id);

create policy "memories_insert" on recipe_memories for insert with check (auth.uid() = user_id);
create policy "memories_read" on recipe_memories for select using (
  exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
  or exists (select 1 from recipes where id = recipe_id and is_public = true)
  or exists (
    select 1 from family_recipes fr
    join family_members fm on fr.family_id = fm.family_id
    where fr.recipe_id = recipe_id and fm.user_id = auth.uid()
  )
);

-- Families: members can read, admin can update
create policy "families_member_read" on families for select using (
  exists (select 1 from family_members where family_id = id and user_id = auth.uid())
);
create policy "families_insert" on families for insert with check (auth.uid() = created_by);
create policy "families_admin_update" on families for update using (
  exists (select 1 from family_members where family_id = id and user_id = auth.uid() and role = 'admin')
);

create policy "family_members_read" on family_members for select using (
  exists (select 1 from family_members fm2 where fm2.family_id = family_id and fm2.user_id = auth.uid())
);
create policy "family_members_insert" on family_members for insert with check (
  auth.uid() = user_id or
  exists (select 1 from family_members where family_id = family_id and user_id = auth.uid() and role = 'admin')
);

create policy "family_recipes_read" on family_recipes for select using (
  exists (select 1 from family_members where family_id = family_id and user_id = auth.uid())
);
create policy "family_recipes_insert" on family_recipes for insert with check (
  exists (select 1 from family_members where family_id = family_id and user_id = auth.uid())
);

-- Events: host full access, guests read
create policy "events_host" on events for all using (auth.uid() = host_id);
create policy "events_guest_read" on events for select using (
  exists (select 1 from event_guests where event_id = id and user_id = auth.uid())
);

create policy "event_guests_host" on event_guests for all using (
  exists (select 1 from events where id = event_id and host_id = auth.uid())
);
create policy "event_guests_read_own" on event_guests for select using (auth.uid() = user_id);

create policy "event_recipes_host" on event_recipes for all using (
  exists (select 1 from events where id = event_id and host_id = auth.uid())
);
create policy "event_recipes_guest_read" on event_recipes for select using (
  exists (select 1 from event_guests where event_id = event_id and user_id = auth.uid())
);

-- Corrections: owner only
create policy "corrections_owner" on digitize_corrections for all using (
  exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
);

-- ── INDEXES ─────────────────────────────────────────────────
create index if not exists idx_recipes_user_id on recipes(user_id);
create index if not exists idx_recipes_is_public on recipes(is_public);
create index if not exists idx_recipe_ingredients_recipe_id on recipe_ingredients(recipe_id);
create index if not exists idx_recipe_steps_recipe_id on recipe_steps(recipe_id);
create index if not exists idx_recipe_comments_recipe_id on recipe_comments(recipe_id);
create index if not exists idx_recipe_memories_recipe_id on recipe_memories(recipe_id);
create index if not exists idx_family_members_user_id on family_members(user_id);
create index if not exists idx_family_members_family_id on family_members(family_id);
create index if not exists idx_event_recipes_event_id on event_recipes(event_id);
