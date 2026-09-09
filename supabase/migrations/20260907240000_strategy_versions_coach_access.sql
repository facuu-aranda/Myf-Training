begin;

drop policy if exists strategy_versions_own on public.strategy_versions;
create policy strategy_versions_select_authorized on public.strategy_versions
  for select using (
    user_id = auth.uid()
    or (space_id is not null and public.has_coach_permission(space_id, user_id, 'strategy_view'))
  );
create policy strategy_versions_insert_own on public.strategy_versions
  for insert with check (user_id = auth.uid() or (space_id is not null and public.has_coach_permission(space_id, user_id, 'strategy_manage')));

create or replace function public.restore_coach_strategy_version(source_version_id uuid, reason text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  source_version record;
  new_version_id uuid := gen_random_uuid();
  next_version integer;
begin
  select version.* into source_version from public.strategy_versions version where version.id = source_version_id and version.status in ('draft', 'published', 'archived');
  if source_version.id is null then raise exception 'Strategy version not found'; end if;
  if source_version.space_id is null or not public.has_coach_permission(source_version.space_id, source_version.user_id, 'strategy_manage', current_user_id) then raise exception 'Not authorized to restore Strategy version'; end if;
  select coalesce(max(version_number), 0) + 1 into next_version from public.strategy_versions where user_id = source_version.user_id;
  insert into public.strategy_versions (id, user_id, created_by, space_id, relationship_id, name, starts_on, is_current, snapshot, version_number, status, change_reason)
  values (new_version_id, source_version.user_id, current_user_id, source_version.space_id, source_version.relationship_id, 'Restored Strategy Draft', current_date, false, source_version.snapshot, next_version, 'draft', coalesce(nullif(reason, ''), 'Restored from version ' || source_version.version_number));
  insert into public.audit_logs (actor_user_id, target_user_id, space_id, relationship_id, action, entity_type, entity_id, metadata)
  values (current_user_id, source_version.user_id, source_version.space_id, source_version.relationship_id, 'strategy_restored', 'strategy_version', new_version_id, jsonb_build_object('source_version_id', source_version_id));
  return new_version_id;
end;
$$;

grant execute on function public.restore_coach_strategy_version(uuid, text) to authenticated;

commit;
