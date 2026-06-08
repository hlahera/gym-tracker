-- Gym Tracker — ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard → tu proyecto → SQL Editor

-- Perfiles de usuario (sync con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  default_weight_increment numeric(5,2) not null default 2.5,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ejercicios personalizados por usuario
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  muscle_group text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Días de la plantilla semanal (0=domingo … 6=sábado)
create table if not exists public.template_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  name text not null default 'Entrenamiento',
  created_at timestamptz not null default now(),
  unique (user_id, day_of_week)
);

-- Ejercicios en cada día de plantilla
create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.template_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sort_order int not null default 0,
  target_sets int not null default 3,
  target_reps int not null default 8,
  created_at timestamptz not null default now()
);

-- Sesiones de entrenamiento
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null default current_date,
  week_year int not null,
  week_number int not null,
  template_day_id uuid references public.template_days(id) on delete set null,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Series registradas
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_number int not null check (set_number >= 1),
  weight numeric(7,2) not null default 0,
  reps int not null default 0,
  completed boolean not null default true,
  from_template boolean not null default true,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_exercises_user on public.exercises(user_id);
create index if not exists idx_sessions_user_date on public.workout_sessions(user_id, session_date desc);
create index if not exists idx_sets_session on public.workout_sets(session_id);
create index if not exists idx_sets_exercise on public.workout_sets(exercise_id);
create index if not exists idx_profiles_last_seen on public.profiles(last_seen_at desc);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_emails text[] := string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',');
begin
  insert into public.profiles (id, email, display_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email = any(admin_emails) or not exists (select 1 from public.profiles)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for user execute function public.handle_new_user();

-- Actualizar last_seen_at
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;

-- Estadísticas de uso (solo admins)
create or replace function public.get_app_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_user boolean;
  result json;
begin
  select p.is_admin into is_admin_user
  from public.profiles p
  where p.id = auth.uid();

  if not coalesce(is_admin_user, false) then
    raise exception 'No autorizado';
  end if;

  select json_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_7d', (select count(*) from public.profiles where last_seen_at >= now() - interval '7 days'),
    'active_30d', (select count(*) from public.profiles where last_seen_at >= now() - interval '30 days'),
    'new_users_7d', (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'new_users_30d', (select count(*) from public.profiles where created_at >= now() - interval '30 days')
  ) into result;

  return result;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.template_days enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

-- Profiles: ver propio perfil; admins ven todos (para stats en cliente)
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Exercises
create policy "exercises_all_own" on public.exercises for all using (auth.uid() = user_id);

-- Template days
create policy "template_days_all_own" on public.template_days for all using (auth.uid() = user_id);

-- Template exercises (via template_days ownership)
create policy "template_exercises_select" on public.template_exercises for select
  using (exists (select 1 from public.template_days td where td.id = template_day_id and td.user_id = auth.uid()));
create policy "template_exercises_insert" on public.template_exercises for insert
  with check (exists (select 1 from public.template_days td where td.id = template_day_id and td.user_id = auth.uid()));
create policy "template_exercises_update" on public.template_exercises for update
  using (exists (select 1 from public.template_days td where td.id = template_day_id and td.user_id = auth.uid()));
create policy "template_exercises_delete" on public.template_exercises for delete
  using (exists (select 1 from public.template_days td where td.id = template_day_id and td.user_id = auth.uid()));

-- Workout sessions
create policy "sessions_all_own" on public.workout_sessions for all using (auth.uid() = user_id);

-- Workout sets (via session ownership)
create policy "sets_select" on public.workout_sets for select
  using (exists (select 1 from public.workout_sessions ws where ws.id = session_id and ws.user_id = auth.uid()));
create policy "sets_insert" on public.workout_sets for insert
  with check (exists (select 1 from public.workout_sessions ws where ws.id = session_id and ws.user_id = auth.uid()));
create policy "sets_update" on public.workout_sets for update
  using (exists (select 1 from public.workout_sessions ws where ws.id = session_id and ws.user_id = auth.uid()));
create policy "sets_delete" on public.workout_sets for delete
  using (exists (select 1 from public.workout_sessions ws where ws.id = session_id and ws.user_id = auth.uid()));

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant execute on function public.touch_last_seen() to authenticated;
grant execute on function public.get_app_stats() to authenticated;
