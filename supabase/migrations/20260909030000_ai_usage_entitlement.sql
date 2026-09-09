-- Deterministic server-side AI quota accounting.

create or replace function public.consume_my_ai_interaction()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  quota integer;
  period_start_date date := date_trunc('month', timezone('utc', now()))::date;
  period_end_date date := (date_trunc('month', timezone('utc', now())) + interval '1 month - 1 day')::date;
  consumed integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  quota := coalesce((public.get_my_effective_entitlements() ->> 'ai_monthly_interactions')::integer, 0);
  if quota <= 0 then return false; end if;
  insert into public.usage_counters (user_id, metric, period_start, period_end, used, limit_snapshot)
  values (current_user_id, 'ai_interactions', period_start_date, period_end_date, 0, quota)
  on conflict (user_id, metric, period_start) do update set limit_snapshot = greatest(public.usage_counters.limit_snapshot, excluded.limit_snapshot), period_end = excluded.period_end;
  update public.usage_counters
  set used = used + 1, updated_at = timezone('utc', now())
  where user_id = current_user_id and metric = 'ai_interactions' and period_start = period_start_date and used < limit_snapshot
  returning used into consumed;
  return consumed is not null;
end;
$$;

grant execute on function public.consume_my_ai_interaction() to authenticated;

create or replace function public.release_my_ai_interaction()
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_counters
  set used = greatest(0, used - 1), updated_at = timezone('utc', now())
  where user_id = auth.uid()
    and metric = 'ai_interactions'
    and period_start = date_trunc('month', timezone('utc', now()))::date
    and used > 0;
$$;

grant execute on function public.release_my_ai_interaction() to authenticated;

create or replace function public.get_my_ai_usage()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'period_start', date_trunc('month', timezone('utc', now()))::date,
    'period_end', (date_trunc('month', timezone('utc', now())) + interval '1 month - 1 day')::date,
    'used', coalesce((select used from public.usage_counters where user_id = auth.uid() and metric = 'ai_interactions' and period_start = date_trunc('month', timezone('utc', now()))::date), 0),
    'limit', coalesce((public.get_my_effective_entitlements() ->> 'ai_monthly_interactions')::integer, 0)
  );
$$;

grant execute on function public.get_my_ai_usage() to authenticated;
