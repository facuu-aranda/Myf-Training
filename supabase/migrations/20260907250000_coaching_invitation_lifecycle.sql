begin;

create or replace function public.cancel_coaching_invitation(invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
begin
  select * into invitation from public.space_invitations where id = invitation_id for update;
  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.inviter_user_id <> auth.uid() and not public.is_space_owner(invitation.space_id) then raise exception 'Not authorized to cancel invitation'; end if;
  if invitation.status <> 'pending' then return false; end if;
  update public.space_invitations set status = 'cancelled', updated_at = timezone('utc', now()) where id = invitation_id;
  return true;
end;
$$;

grant execute on function public.cancel_coaching_invitation(uuid) to authenticated;

create or replace function public.resend_coaching_invitation(invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
begin
  select * into invitation from public.space_invitations where id = invitation_id for update;
  if invitation.id is null then raise exception 'Invitation not found'; end if;
  if invitation.inviter_user_id <> auth.uid() and not public.is_space_owner(invitation.space_id) then raise exception 'Not authorized to resend invitation'; end if;
  if invitation.status not in ('pending', 'expired') then raise exception 'Invitation cannot be resent'; end if;
  update public.space_invitations set status = 'pending', expires_at = timezone('utc', now()) + interval '7 days', updated_at = timezone('utc', now()) where id = invitation_id;
  return true;
end;
$$;

grant execute on function public.resend_coaching_invitation(uuid) to authenticated;

commit;
