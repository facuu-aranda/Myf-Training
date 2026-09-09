begin;

create or replace function public.invite_coaching_athlete(target_space_id uuid, target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  invitation_id uuid := gen_random_uuid();
  space_owner_id uuid;
  athlete_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if current_user_id = target_user_id then raise exception 'Cannot invite yourself'; end if;
  select owner_user_id into space_owner_id from public.spaces where id = target_space_id and type = 'coaching' and status = 'active';
  if space_owner_id is null then raise exception 'Coaching space not found'; end if;
  if space_owner_id <> current_user_id and not exists (
    select 1 from public.space_members
    where space_id = target_space_id and user_id = current_user_id and role = 'coach' and status = 'active' and left_at is null
  ) then raise exception 'Not authorized to invite athletes'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id and active = true) then raise exception 'Athlete not found'; end if;
  select count(*) into athlete_count from public.space_members where space_id = target_space_id and role = 'athlete' and status = 'active' and left_at is null;
  if athlete_count >= (select max_members from public.spaces where id = target_space_id) then raise exception 'No athlete capacity available'; end if;
  insert into public.space_invitations (id, space_id, inviter_user_id, invitee_user_id)
  values (invitation_id, target_space_id, current_user_id, target_user_id);
  return invitation_id;
end;
$$;

grant execute on function public.invite_coaching_athlete(uuid, uuid) to authenticated;

commit;
