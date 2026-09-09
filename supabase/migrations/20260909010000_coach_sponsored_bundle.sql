-- Non-public entitlement bundle for athletes sponsored by a Coach.
alter table public.plans drop constraint if exists plans_code_check;
alter table public.plans add constraint plans_code_check check (code in ('free', 'plus', 'couple', 'household', 'coach_starter', 'coach_pro', 'coach_studio', 'coach_sponsored_athlete'));

insert into public.plans (code, name, description, public, sort_order)
values ('coach_sponsored_athlete', 'Coach Sponsored Athlete', 'Benefits granted by an active coaching relationship', false, 110)
on conflict (code) do update set description = excluded.description, public = excluded.public;

insert into public.plan_entitlements (plan_id, entitlement_key, value)
select p.id, v.key, v.value::jsonb
from public.plans p
cross join (values
  ('ad_free', 'true'),
  ('history_days', '-1'),
  ('progress_ranges', '[7,30,90,180,"all"]'),
  ('coach_managed_strategy', 'true'),
  ('coach_progress_view', 'true'),
  ('coach_history_view', 'true')
) as v(key, value)
where p.code = 'coach_sponsored_athlete'
on conflict (plan_id, entitlement_key) do update set value = excluded.value;
