begin;

create table if not exists public.ai_action_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('create_custom_food', 'log_food', 'add_meal_to_plan', 'create_workout_draft')),
  status text not null default 'pending' check (status in ('pending', 'executed', 'cancelled')),
  result jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  executed_at timestamptz
);

create index if not exists ai_action_requests_user_created_idx on public.ai_action_requests(user_id, created_at desc);
alter table public.ai_action_requests enable row level security;

drop policy if exists ai_action_requests_own on public.ai_action_requests;
create policy ai_action_requests_own on public.ai_action_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.ai_action_requests to authenticated;

commit;
