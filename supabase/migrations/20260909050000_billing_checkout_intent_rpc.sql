-- Secure local checkout intent creation. A provider redirect is intentionally not created here.
create or replace function public.create_billing_checkout_intent(target_plan_price_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  selected_price public.plan_prices%rowtype;
  selected_plan public.plans%rowtype;
  intent_id uuid := gen_random_uuid();
  expiry timestamptz := timezone('utc', now()) + interval '30 minutes';
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select pp.* into selected_price from public.plan_prices pp where pp.id = target_plan_price_id and pp.active and (pp.valid_until is null or pp.valid_until > timezone('utc', now()));
  if selected_price.id is null then raise exception 'Plan price is unavailable'; end if;
  select p.* into selected_plan from public.plans p where p.id = selected_price.plan_id and p.active and p.public;
  if selected_plan.id is null or selected_plan.code = 'free' then raise exception 'Paid public plan required'; end if;
  if exists (select 1 from public.subscriptions s where s.user_id = current_user_id and s.status in ('pending','active','past_due','paused','trialing','grace') and s.current_period_end >= timezone('utc', now())) then
    raise exception 'Active subscription already exists';
  end if;
  insert into public.billing_checkout_intents (id, user_id, plan_price_id, provider, status, expires_at)
  values (intent_id, current_user_id, selected_price.id, 'mercadopago', 'created', expiry);
  return jsonb_build_object('id', intent_id, 'status', 'created', 'expires_at', expiry, 'plan_code', selected_plan.code, 'plan_price_id', selected_price.id);
end;
$$;

grant execute on function public.create_billing_checkout_intent(uuid) to authenticated;
