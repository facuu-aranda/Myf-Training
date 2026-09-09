begin;

alter table public.strategy_versions replica identity full;
alter table public.strategy_management replica identity full;
alter table public.coach_notes replica identity full;
alter table public.space_invitations replica identity full;
alter table public.coach_athlete_relationships replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.strategy_versions;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.strategy_management;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.coach_notes;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.space_invitations;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.coach_athlete_relationships;
exception when duplicate_object then null;
end $$;

commit;
