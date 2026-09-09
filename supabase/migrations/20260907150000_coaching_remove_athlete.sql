begin;

create or replace function public.remove_coaching_athlete(target_space_id uuid, target_athlete_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_role text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select role into current_role from public.space_members where space_id = target_space_id and user_id = current_user_id and status = 'active' and left_at is null;
  if current_role not in ('owner', 'coach') then raise exception 'Not authorized to remove athletes'; end if;
  update public.space_members set status = 'inactive', left_at = timezone('utc', now()), updated_at = timezone('utc', now()) where space_id = target_space_id and user_id = target_athlete_id and role = 'athlete' and status = 'active';
  update public.coach_athlete_relationships set status = 'ended', ended_at = timezone('utc', now()), updated_at = timezone('utc', now()) where space_id = target_space_id and athlete_user_id = target_athlete_id and status in ('pending', 'active', 'paused');
  return found;
end;
$$;

grant execute on function public.remove_coaching_athlete(uuid, uuid) to authenticated;

commit;
