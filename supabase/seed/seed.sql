insert into public.couples (id, name)
values ('11111111-1111-4111-8111-111111111111', 'Train Together')
on conflict (id) do update set name = excluded.name;

insert into public.profiles (id, username, display_name, first_name, daily_step_goal, daily_calorie_goal)
select u.id, split_part(u.email, '@', 1), initcap(split_part(u.email, '@', 1)), initcap(split_part(u.email, '@', 1)),
  case when split_part(u.email, '@', 1) = 'maria' then 9000 else 10000 end,
  case when split_part(u.email, '@', 1) = 'maria' then 1900 else 2200 end
from auth.users u
where u.email in ('fabricio@train-together.local', 'maria@train-together.local')
on conflict (id) do update set username = excluded.username, display_name = excluded.display_name, first_name = excluded.first_name;

insert into public.couple_members (couple_id, user_id)
select '11111111-1111-4111-8111-111111111111', p.id
from public.profiles p
where p.username in ('fabricio', 'maria')
on conflict (couple_id, user_id) do nothing;

insert into public.nutrition_plans (user_id, calories, protein, carbs, fats, fiber, notes)
select p.id,
  case when p.username = 'maria' then 1900 else 2200 end,
  case when p.username = 'maria' then 135 else 180 end,
  case when p.username = 'maria' then 190 else 220 end,
  case when p.username = 'maria' then 62 else 70 end,
  case when p.username = 'maria' then 28 else 30 end,
  'Initial plan'
from public.profiles p
where p.username in ('fabricio', 'maria')
on conflict (user_id) do nothing;
