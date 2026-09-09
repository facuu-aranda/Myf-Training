begin;

create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  relationship_id uuid not null references public.coach_athlete_relationships(id) on delete cascade,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  athlete_user_id uuid not null references public.profiles(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  content text not null check (length(btrim(content)) between 1 and 5000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists coach_notes_relationship_idx on public.coach_notes(relationship_id, created_at desc) where deleted_at is null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  space_id uuid references public.spaces(id) on delete set null,
  relationship_id uuid references public.coach_athlete_relationships(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_space_created_idx on public.audit_logs(space_id, created_at desc);
create index if not exists audit_logs_target_created_idx on public.audit_logs(target_user_id, created_at desc);

alter table public.coach_notes enable row level security;
alter table public.audit_logs enable row level security;

create policy coach_notes_select_authorized on public.coach_notes
  for select using (coach_user_id = auth.uid() or (visibility = 'shared' and athlete_user_id = auth.uid()));
create policy audit_logs_select_actor_or_space_manager on public.audit_logs
  for select using (actor_user_id = auth.uid() or (space_id is not null and public.is_space_member(space_id)));

grant select on public.coach_notes to authenticated;
grant select on public.audit_logs to authenticated;

create or replace function public.create_coach_note(target_space_id uuid, target_athlete_id uuid, note_content text, note_visibility text default 'private')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  relationship record;
  note_id uuid := gen_random_uuid();
begin
  if not public.has_coach_permission(target_space_id, target_athlete_id, 'notes_manage') then raise exception 'Not authorized to create Coach note'; end if;
  if note_visibility not in ('private', 'shared') then raise exception 'Invalid note visibility'; end if;
  if note_content is null or length(btrim(note_content)) = 0 or length(note_content) > 5000 then raise exception 'Invalid note content'; end if;
  select relation.* into relationship from public.coach_athlete_relationships relation where relation.space_id = target_space_id and relation.coach_user_id = current_user_id and relation.athlete_user_id = target_athlete_id and relation.status = 'active';
  if relationship.id is null then raise exception 'No active coach relationship'; end if;
  insert into public.coach_notes (id, space_id, relationship_id, coach_user_id, athlete_user_id, visibility, content)
  values (note_id, target_space_id, relationship.id, current_user_id, target_athlete_id, note_visibility, btrim(note_content));
  insert into public.audit_logs (actor_user_id, target_user_id, space_id, relationship_id, action, entity_type, entity_id)
  values (current_user_id, target_athlete_id, target_space_id, relationship.id, 'coach_note_created', 'coach_note', note_id);
  return note_id;
end;
$$;

grant execute on function public.create_coach_note(uuid, uuid, text, text) to authenticated;

create or replace function public.get_coach_notes(target_space_id uuid, target_athlete_id uuid)
returns table (id uuid, content text, visibility text, created_at timestamptz, updated_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select note.id, note.content, note.visibility, note.created_at, note.updated_at
  from public.coach_notes note
  where note.space_id = target_space_id
    and note.athlete_user_id = target_athlete_id
    and note.deleted_at is null
    and note.coach_user_id = auth.uid()
  order by note.created_at desc;
$$;

grant execute on function public.get_coach_notes(uuid, uuid) to authenticated;

commit;
