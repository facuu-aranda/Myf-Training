begin;

create or replace function public.respond_to_follow_request(follow_id uuid, decision text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  request record;
begin
  select * into request from public.profile_follows where id = follow_id for update;
  if request.id is null or request.followed_id <> auth.uid() then raise exception 'Follow request not found'; end if;
  if request.status <> 'pending' then return false; end if;
  if decision not in ('accepted', 'rejected') then raise exception 'Invalid follow decision'; end if;
  update public.profile_follows set status = decision, accepted_at = case when decision = 'accepted' then timezone('utc', now()) else null end, updated_at = timezone('utc', now()) where id = follow_id;
  return true;
end;
$$;

grant execute on function public.respond_to_follow_request(uuid, text) to authenticated;

create or replace function public.block_profile_follow(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id = auth.uid() then raise exception 'Cannot block yourself'; end if;
  insert into public.profile_follows (follower_id, followed_id, status)
  values (auth.uid(), target_user_id, 'blocked')
  on conflict (follower_id, followed_id) do update set status = 'blocked', updated_at = timezone('utc', now());
  update public.profile_follows set status = 'blocked', updated_at = timezone('utc', now()) where follower_id = target_user_id and followed_id = auth.uid();
  return true;
end;
$$;

grant execute on function public.block_profile_follow(uuid) to authenticated;

create or replace function public.unfollow_profile(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  delete from public.profile_follows where follower_id = auth.uid() and followed_id = target_user_id;
  select true;
$$;

grant execute on function public.unfollow_profile(uuid) to authenticated;

commit;
