-- Commercial catalog, entitlements and billing foundation.
-- Provider integrations are intentionally decoupled from product authorization.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('free', 'plus', 'couple', 'household', 'coach_starter', 'coach_pro', 'coach_studio')),
  name text not null,
  description text not null default '',
  active boolean not null default true,
  public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  currency text not null check (currency in ('ARS', 'USD')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  amount_minor integer not null check (amount_minor >= 0),
  active boolean not null default true,
  valid_from timestamptz not null default timezone('utc', now()),
  valid_until timestamptz,
  provider text,
  provider_price_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (plan_id, currency, billing_interval, valid_from)
);

create table if not exists public.entitlement_definitions (
  key text primary key,
  value_type text not null check (value_type in ('boolean', 'number', 'string', 'array')),
  description text not null default '',
  default_value jsonb not null default 'false'::jsonb
);

create table if not exists public.plan_entitlements (
  plan_id uuid not null references public.plans(id) on delete cascade,
  entitlement_key text not null references public.entitlement_definitions(key) on delete cascade,
  value jsonb not null,
  primary key (plan_id, entitlement_key)
);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  payer_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  plan_price_id uuid references public.plan_prices(id),
  provider text not null default 'seed',
  provider_subscription_id text,
  status text not null check (status in ('pending', 'active', 'past_due', 'paused', 'canceled', 'expired', 'trialing', 'grace')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  currency text not null check (currency in ('ARS', 'USD')),
  amount_minor integer not null check (amount_minor >= 0),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_ends_at timestamptz,
  grace_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists subscriptions_one_active_owner_idx on public.subscriptions(user_id) where status in ('pending', 'active', 'past_due', 'paused', 'trialing', 'grace');

create table if not exists public.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bundle_code text not null references public.plans(code),
  source_type text not null check (source_type in ('subscription', 'household_membership', 'coaching_relationship', 'admin', 'seed', 'migration')),
  source_id uuid,
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider_subscription_id text,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, provider_event_id)
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric text not null check (metric in ('ai_interactions', 'coach_ai_interactions')),
  period_start date not null,
  period_end date not null,
  used integer not null default 0 check (used >= 0),
  limit_snapshot integer not null default 0 check (limit_snapshot >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, metric, period_start)
);

create table if not exists public.billing_provider_prices (
  id uuid primary key default gen_random_uuid(),
  plan_price_id uuid not null references public.plan_prices(id) on delete cascade,
  provider text not null check (provider = 'mercadopago'),
  provider_plan_id text not null,
  environment text not null check (environment in ('test', 'production')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (plan_price_id, provider, environment)
);

create table if not exists public.billing_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_price_id uuid not null references public.plan_prices(id),
  provider text not null default 'mercadopago',
  status text not null default 'created' check (status in ('created', 'redirected', 'completed', 'failed', 'expired')),
  provider_reference text,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.plans (code, name, description, public, sort_order) values
  ('free', 'Free', 'Personal fitness essentials', true, 10),
  ('plus', 'Plus', 'Advanced personal features', true, 20),
  ('couple', 'Couple', 'Shared benefits for two people', true, 30),
  ('household', 'Household', 'Shared benefits for up to five people', true, 40),
  ('coach_starter', 'Coach Starter', 'Coaching for up to ten active athletes', true, 50),
  ('coach_pro', 'Coach Pro', 'Advanced coaching analytics for up to thirty athletes', true, 60),
  ('coach_studio', 'Coach Studio', 'Reserved for a future release', false, 100)
on conflict (code) do update set name = excluded.name, description = excluded.description, public = excluded.public, sort_order = excluded.sort_order, updated_at = timezone('utc', now());

insert into public.entitlement_definitions (key, value_type, description, default_value) values
  ('ad_free', 'boolean', 'Suppress advertising surfaces when an ad provider is enabled', 'false'),
  ('history_days', 'number', 'Number of days available in history; -1 means unlimited', '30'),
  ('progress_ranges', 'array', 'Available progress ranges', '[7, 30]'),
  ('advanced_personal_analytics', 'boolean', 'Advanced personal analytics', 'false'),
  ('ai_monthly_interactions', 'number', 'Personal AI interactions per billing period', '0'),
  ('exports_personal', 'boolean', 'Personal exports', 'false'),
  ('strategy_versions_personal', 'boolean', 'Personal Strategy version history', 'false'),
  ('custom_foods_create', 'boolean', 'Create custom foods', 'false'),
  ('custom_exercises_create', 'boolean', 'Create custom exercises', 'false'),
  ('household_create', 'boolean', 'Create a Household', 'false'),
  ('household_max_members', 'number', 'Maximum Household members including owner', '0'),
  ('coaching_create', 'boolean', 'Create a Coaching Space', 'false'),
  ('coaching_max_athletes', 'number', 'Maximum active athletes', '0'),
  ('coach_managed_strategy', 'boolean', 'Receive a coach-managed Strategy', 'false'),
  ('coach_strategy_manage', 'boolean', 'Manage an athlete Strategy', 'false'),
  ('coach_progress_view', 'boolean', 'View athlete progress', 'false'),
  ('coach_history_view', 'boolean', 'View athlete history', 'false'),
  ('coach_notes', 'boolean', 'Create Coach Notes', 'false'),
  ('coach_draft_publish', 'boolean', 'Draft and publish Strategies', 'false'),
  ('coach_basic_analytics', 'boolean', 'Basic coaching analytics', 'false'),
  ('coach_advanced_analytics', 'boolean', 'Advanced coaching analytics', 'false'),
  ('coach_roster_analytics', 'boolean', 'Roster analytics', 'false'),
  ('coach_attention_queue', 'boolean', 'Needs Attention queue', 'false'),
  ('coach_program_templates', 'boolean', 'Program templates', 'false'),
  ('coach_nutrition_templates', 'boolean', 'Nutrition templates', 'false'),
  ('coach_duplicate_strategy', 'boolean', 'Duplicate Strategy', 'false'),
  ('coach_reports', 'boolean', 'Professional reports', 'false'),
  ('coach_advanced_exports', 'boolean', 'Advanced exports', 'false'),
  ('coach_custom_exercise_library', 'boolean', 'Coach custom exercise library', 'false')
on conflict (key) do update set description = excluded.description, default_value = excluded.default_value;

insert into public.plan_prices (plan_id, currency, billing_interval, amount_minor, provider)
select p.id, 'ARS', billing_interval, amount, 'mercadopago'
from public.plans p
join (values
  ('free', 'month', 0), ('free', 'year', 0),
  ('plus', 'month', 799000), ('plus', 'year', 7990000),
  ('couple', 'month', 1399000), ('couple', 'year', 13990000),
  ('household', 'month', 2299000), ('household', 'year', 22990000),
  ('coach_starter', 'month', 2999000), ('coach_starter', 'year', 29990000),
  ('coach_pro', 'month', 5999000), ('coach_pro', 'year', 59990000)
) as prices(code, billing_interval, amount) on prices.code = p.code
where not exists (select 1 from public.plan_prices existing where existing.plan_id = p.id and existing.currency = 'ARS' and existing.billing_interval = prices.billing_interval and existing.active);

-- Plan entitlements are intentionally explicit. Membership grants use plus/coach bundles without granting creation rights.
with values(code, key, value) as (values
 ('free','ad_free','false'), ('free','history_days','30'), ('free','progress_ranges','[7,30]'),
 ('plus','ad_free','true'), ('plus','history_days','-1'), ('plus','progress_ranges','[7,30,90,180,"all"]'), ('plus','advanced_personal_analytics','true'), ('plus','ai_monthly_interactions','50'), ('plus','exports_personal','true'), ('plus','strategy_versions_personal','true'), ('plus','custom_foods_create','true'), ('plus','custom_exercises_create','true'),
 ('couple','ad_free','true'), ('couple','history_days','-1'), ('couple','progress_ranges','[7,30,90,180,"all"]'), ('couple','advanced_personal_analytics','true'), ('couple','ai_monthly_interactions','50'), ('couple','exports_personal','true'), ('couple','strategy_versions_personal','true'), ('couple','custom_foods_create','true'), ('couple','custom_exercises_create','true'), ('couple','household_create','true'), ('couple','household_max_members','2'),
 ('household','ad_free','true'), ('household','history_days','-1'), ('household','progress_ranges','[7,30,90,180,"all"]'), ('household','advanced_personal_analytics','true'), ('household','ai_monthly_interactions','50'), ('household','exports_personal','true'), ('household','strategy_versions_personal','true'), ('household','custom_foods_create','true'), ('household','custom_exercises_create','true'), ('household','household_create','true'), ('household','household_max_members','5'),
 ('coach_starter','ad_free','true'), ('coach_starter','history_days','-1'), ('coach_starter','progress_ranges','[7,30,90,180,"all"]'), ('coach_starter','advanced_personal_analytics','true'), ('coach_starter','ai_monthly_interactions','50'), ('coach_starter','exports_personal','true'), ('coach_starter','strategy_versions_personal','true'), ('coach_starter','custom_foods_create','true'), ('coach_starter','custom_exercises_create','true'), ('coach_starter','coaching_create','true'), ('coach_starter','coaching_max_athletes','10'), ('coach_starter','coach_strategy_manage','true'), ('coach_starter','coach_progress_view','true'), ('coach_starter','coach_history_view','true'), ('coach_starter','coach_notes','true'), ('coach_starter','coach_draft_publish','true'), ('coach_starter','coach_basic_analytics','true'),
 ('coach_pro','ad_free','true'), ('coach_pro','history_days','-1'), ('coach_pro','progress_ranges','[7,30,90,180,"all"]'), ('coach_pro','advanced_personal_analytics','true'), ('coach_pro','ai_monthly_interactions','100'), ('coach_pro','exports_personal','true'), ('coach_pro','strategy_versions_personal','true'), ('coach_pro','custom_foods_create','true'), ('coach_pro','custom_exercises_create','true'), ('coach_pro','coaching_create','true'), ('coach_pro','coaching_max_athletes','30'), ('coach_pro','coach_strategy_manage','true'), ('coach_pro','coach_progress_view','true'), ('coach_pro','coach_history_view','true'), ('coach_pro','coach_notes','true'), ('coach_pro','coach_draft_publish','true'), ('coach_pro','coach_basic_analytics','true'), ('coach_pro','coach_advanced_analytics','true'), ('coach_pro','coach_roster_analytics','true'), ('coach_pro','coach_attention_queue','true'), ('coach_pro','coach_program_templates','true'), ('coach_pro','coach_nutrition_templates','true'), ('coach_pro','coach_duplicate_strategy','true'), ('coach_pro','coach_reports','true'), ('coach_pro','coach_advanced_exports','true'), ('coach_pro','coach_custom_exercise_library','true')
)
insert into public.plan_entitlements (plan_id, entitlement_key, value)
select p.id, v.key, v.value::jsonb from values v join public.plans p on p.code = v.code
on conflict (plan_id, entitlement_key) do update set value = excluded.value;

create or replace function public.get_my_effective_entitlements()
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare result jsonb := '{}'::jsonb; item record; current jsonb; merged jsonb;
begin
  if auth.uid() is null then return result; end if;
  select jsonb_object_agg(d.key, d.default_value) into result from public.entitlement_definitions d;
  for item in
    select pe.entitlement_key as key, pe.value from public.plan_entitlements pe join public.plans p on p.id = pe.plan_id
    join public.subscriptions s on s.plan_id = p.id and s.user_id = auth.uid() and s.status in ('active','past_due','paused','trialing','grace') and s.current_period_end >= timezone('utc', now())
    union all
    select pe.entitlement_key, pe.value from public.plan_entitlements pe join public.plans p on p.id = pe.plan_id
    join public.entitlement_grants g on g.bundle_code = p.code and g.user_id = auth.uid() and g.active and g.starts_at <= timezone('utc', now()) and (g.ends_at is null or g.ends_at >= timezone('utc', now()))
  loop
    current := coalesce(result -> item.key, 'false'::jsonb);
    if jsonb_typeof(item.value) = 'boolean' then merged := to_jsonb((current #>> '{}')::boolean or (item.value #>> '{}')::boolean);
    elsif jsonb_typeof(item.value) = 'number' then merged := to_jsonb(greatest((current #>> '{}')::numeric, (item.value #>> '{}')::numeric));
    elsif jsonb_typeof(item.value) = 'array' then merged := (select jsonb_agg(distinct value order by value) from jsonb_array_elements(current || item.value));
    else merged := item.value; end if;
    result := jsonb_set(result, array[item.key], merged, true);
  end loop;
  return result;
end;
$$;

grant execute on function public.get_my_effective_entitlements() to authenticated;

create or replace view public.public_plan_catalog as
select p.code, p.name, p.description, p.sort_order,
       coalesce(jsonb_agg(jsonb_build_object('currency', pp.currency, 'interval', pp.billing_interval, 'amount_minor', pp.amount_minor) order by pp.currency, pp.billing_interval) filter (where pp.id is not null), '[]'::jsonb) as prices
from public.plans p left join public.plan_prices pp on pp.plan_id = p.id and pp.active and (pp.valid_until is null or pp.valid_until > timezone('utc', now()))
where p.active and p.public group by p.id;

grant select on public.public_plan_catalog to anon, authenticated;

alter table public.plans enable row level security;
alter table public.plan_prices enable row level security;
alter table public.entitlement_definitions enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlement_grants enable row level security;
alter table public.subscription_events enable row level security;
alter table public.usage_counters enable row level security;
alter table public.billing_provider_prices enable row level security;
alter table public.billing_checkout_intents enable row level security;

create policy plans_public_read on public.plans for select using (public and active);
create policy prices_public_read on public.plan_prices for select using (active and (valid_until is null or valid_until > timezone('utc', now())));
create policy billing_customer_own_read on public.billing_customers for select using (user_id = auth.uid());
create policy subscriptions_own_read on public.subscriptions for select using (user_id = auth.uid());
create policy checkout_intent_own_read on public.billing_checkout_intents for select using (user_id = auth.uid());
create policy usage_counter_own_read on public.usage_counters for select using (user_id = auth.uid());

create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status, current_period_end desc);
create index if not exists entitlement_grants_user_active_idx on public.entitlement_grants(user_id, active, ends_at);
create index if not exists checkout_intents_user_idx on public.billing_checkout_intents(user_id, created_at desc);

create trigger plans_set_updated_at before update on public.plans for each row execute function public.set_updated_at();
create trigger plan_prices_set_updated_at before update on public.plan_prices for each row execute function public.set_updated_at();
create trigger billing_customers_set_updated_at before update on public.billing_customers for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger entitlement_grants_set_updated_at before update on public.entitlement_grants for each row execute function public.set_updated_at();
create trigger usage_counters_set_updated_at before update on public.usage_counters for each row execute function public.set_updated_at();
create trigger billing_provider_prices_set_updated_at before update on public.billing_provider_prices for each row execute function public.set_updated_at();
create trigger checkout_intents_set_updated_at before update on public.billing_checkout_intents for each row execute function public.set_updated_at();
