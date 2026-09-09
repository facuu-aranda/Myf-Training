begin;

drop function if exists public.get_coaching_athletes(uuid);

create function public.get_coaching_athletes(target_space_id uuid)
returns table (
  athlete_user_id uuid,
  display_name text,
  public_handle text,
  public_code text,
  avatar_url text,
  relationship_status text,
  relationship_started_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.space_members
    where space_id = target_space_id
      and user_id = auth.uid()
      and role in ('owner', 'coach')
      and status = 'active'
      and left_at is null
  ) then
    raise exception 'Not authorized to view coaching athletes';
  end if;

  return query
  select relation.athlete_user_id,
    profile.display_name,
    profile.public_handle,
    profile.public_code,
    profile.avatar_url,
    relation.status,
    relation.started_at
  from public.coach_athlete_relationships relation
  join public.profiles profile on profile.id = relation.athlete_user_id
  where relation.space_id = target_space_id
    and relation.status = 'active'
  order by profile.display_name asc;
end;
$$;

grant execute on function public.get_coaching_athletes(uuid) to authenticated;

commit;
