-- DevTrack Schema
-- Run this in your Supabase SQL Editor

-- Perfis de usuário (estende auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text check (role in ('admin', 'dev')) default 'dev',
  avatar_url text,
  created_at timestamptz default now()
);

-- Projetos
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text check (status in ('active', 'paused', 'done')) default 'active',
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- Alocação de devs em projetos
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

-- Logs de horas
create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  date date not null,
  hours numeric(4,2) not null check (hours > 0 and hours <= 24),
  description text not null,
  created_at timestamptz default now()
);

-- Trigger: cria profile automaticamente ao cadastrar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'dev')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================
-- Row Level Security (RLS)
-- ============================

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table time_logs enable row level security;

-- Profiles: usuário lê/edita o próprio; admin lê todos
create policy "profiles: self read" on profiles
  for select using (auth.uid() = id);

create policy "profiles: self update" on profiles
  for update using (auth.uid() = id);

create policy "profiles: admin read all" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Projects: todos leem; só admin cria/edita/exclui
create policy "projects: all read" on projects
  for select using (auth.role() = 'authenticated');

create policy "projects: admin insert" on projects
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "projects: admin update" on projects
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "projects: admin delete" on projects
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Project members: todos leem; só admin escreve
create policy "project_members: all read" on project_members
  for select using (auth.role() = 'authenticated');

create policy "project_members: admin write" on project_members
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Time logs: dev lê/escreve os próprios; admin lê todos
create policy "time_logs: self read" on time_logs
  for select using (auth.uid() = user_id);

create policy "time_logs: self insert" on time_logs
  for insert with check (auth.uid() = user_id);

create policy "time_logs: self update" on time_logs
  for update using (auth.uid() = user_id);

create policy "time_logs: self delete" on time_logs
  for delete using (auth.uid() = user_id);

create policy "time_logs: admin read all" on time_logs
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
