begin;

create table if not exists public.space_invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  inviter_user_id uuid not null references public.profiles(id) on delete cascade,
  invitee_user_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null default 'coach_athlete' check (relationship_type = 'coach_athlete'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (inviter_user_id <> invitee_user_id)
);

create unique index if not exists space_invitations_pending_unique_idx
  on public.space_invitations(space_id, invitee_user_id)
  where status = 'pending';
create index if not exists space_invitations_invitee_idx on public.space_invitations(invitee_user_id, status);
create index if not exists space_invitations_space_idx on public.space_invitations(space_id, status);

alter table public.space_invitations enable row level security;

create policy space_invitations_select_visible on public.space_invitations
  for select using (
    invitee_user_id = auth.uid()
    or inviter_user_id = auth.uid()
    or public.is_space_member(space_id)
  );
create policy space_invitations_insert_coach on public.space_invitations
  for insert with check (
    inviter_user_id = auth.uid()
    and public.is_space_member(space_id)
    and exists (select 1 from public.space_members where space_id = space_invitations.space_id and user_id = auth.uid() and role in ('owner', 'coach') and status = 'active' and left_at is null)
  );
create policy space_invitations_update_participant on public.space_invitations
  for update using (invitee_user_id = auth.uid() or inviter_user_id = auth.uid())
  with check (invitee_user_id = auth.uid() or inviter_user_id = auth.uid());

grant select, insert, update on public.space_invitations to authenticated;

create or replace function public.invite_coaching_athlete(target_space_id uuid, target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  invitation_id uuid := gen_random_uuid();
  space_type text;
  current_role text;
  athlete_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if current_user_id = target_user_id then raise exception 'Cannot invite yourself'; end if;
  select type into space_type from public.spaces where id = target_space_id and status = 'active';
  if space_type <> 'coaching' then raise exception 'Only coaching spaces can invite athletes'; end if;
  select role into current_role from public.space_members where space_id = target_space_id and user_id = current_user_id and status = 'active' and left_at is null;
  if current_role not in ('owner', 'coach') then raise exception 'Not authorized to invite athletes'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id and active = true) then raise exception 'Athlete not found'; end if;
  select count(*) into athlete_count from public.space_members where space_id = target_space_id and role = 'athlete' and status = 'active' and left_at is null;
  if athlete_count >= (select max_members from public.spaces where id = target_space_id) then raise exception 'No athlete capacity available'; end if;
  insert into public.space_invitations (id, space_id, inviter_user_id, invitee_user_id)
  values (invitation_id, target_space_id, current_user_id, target_user_id);
  return invitation_id;
end;
$$;

grant execute on function public.invite_coaching_athlete(uuid, uuid) to authenticated;

create or replace function public.accept_coaching_invitation(invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  invitation record;
  athlete_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select * into invitation from public.space_invitations where id = invitation_id and invitee_user_id = current_user_id for update;
  if invitation.id is null or invitation.status <> 'pending' then return false; end if;
  if invitation.expires_at <= timezone('utc', now()) then update public.space_invitations set status = 'expired', updated_at = timezone('utc', now()) where id = invitation_id; return false; end if;
  select count(*) into athlete_count from public.space_members where space_id = invitation.space_id and role = 'athlete' and status = 'active' and left_at is null;
  if athlete_count >= (select max_members from public.spaces where id = invitation.space_id) then return false; end if;
  insert into public.space_members (space_id, user_id, role, status) values (invitation.space_id, current_user_id, 'athlete', 'active') on conflict (space_id, user_id) do update set role = 'athlete', status = 'active', left_at = null;
  insert into public.coach_athlete_relationships (space_id, coach_user_id, athlete_user_id, status, started_at) values (invitation.space_id, invitation.inviter_user_id, current_user_id, 'active', timezone('utc', now())) on conflict (space_id, coach_user_id, athlete_user_id) do update set status = 'active', started_at = timezone('utc', now()), ended_at = null;
  update public.space_invitations set status = 'accepted', accepted_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = invitation_id;
  return true;
end;
$$;

grant execute on function public.accept_coaching_invitation(uuid) to authenticated;

commit;
