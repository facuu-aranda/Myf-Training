begin;

alter table public.exercises
  add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists owner_space_id uuid references public.spaces(id) on delete cascade,
  add column if not exists visibility text not null default 'system',
  add column if not exists status text not null default 'active';

alter table public.exercises drop constraint if exists exercises_visibility_check;
alter table public.exercises add constraint exercises_visibility_check check (visibility in ('private', 'space', 'public', 'system'));
alter table public.exercises drop constraint if exists exercises_status_check;
alter table public.exercises add constraint exercises_status_check check (status in ('active', 'archived'));

create index if not exists exercises_owner_user_idx on public.exercises(owner_user_id, status);
create index if not exists exercises_owner_space_idx on public.exercises(owner_space_id, status);

alter table public.exercises enable row level security;

create policy exercises_select_visible on public.exercises
  for select using (
    (visibility = 'system' and status = 'active')
    or (visibility = 'public' and status = 'active')
    or (owner_user_id = auth.uid())
    or (owner_space_id is not null and public.is_space_member(owner_space_id))
  );
create policy exercises_insert_own on public.exercises
  for insert with check (
    owner_user_id = auth.uid()
    and (
      (visibility = 'private' and owner_space_id is null)
      or (visibility = 'space' and owner_space_id is not null and public.is_space_member(owner_space_id))
    )
  );
create policy exercises_update_own on public.exercises
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy exercises_delete_own on public.exercises
  for delete using (owner_user_id = auth.uid());

grant select, insert, update, delete on public.exercises to authenticated;

create or replace function public.create_custom_exercise(exercise_name text, exercise_name_es text default '', exercise_description text default '', exercise_instructions jsonb default '[]'::jsonb, exercise_muscle_group text default '', exercise_target text default '', exercise_category text default '', exercise_equipment text default '', target_visibility text default 'private', target_space_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_exercise_id uuid := gen_random_uuid();
  external_key text := 'custom-' || new_exercise_id::text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if exercise_name is null or length(btrim(exercise_name)) not between 1 and 160 then raise exception 'Invalid exercise name'; end if;
  if target_visibility not in ('private', 'space') then raise exception 'Invalid custom exercise visibility'; end if;
  if target_visibility = 'space' and (target_space_id is null or not public.is_space_member(target_space_id)) then raise exception 'Not authorized for exercise Space'; end if;
  insert into public.exercises (id, external_id, owner_user_id, owner_space_id, visibility, status, name, name_es, description, instructions, muscle_group, target, category, equipment, source)
  values (new_exercise_id, external_key, current_user_id, case when target_visibility = 'space' then target_space_id else null end, target_visibility, 'active', btrim(exercise_name), coalesce(exercise_name_es, ''), coalesce(exercise_description, ''), coalesce(exercise_instructions, '[]'::jsonb), coalesce(exercise_muscle_group, ''), coalesce(exercise_target, ''), coalesce(exercise_category, ''), coalesce(exercise_equipment, ''), 'user-custom');
  return new_exercise_id;
end;
$$;

grant execute on function public.create_custom_exercise(text, text, text, jsonb, text, text, text, text, text, uuid) to authenticated;

commit;
