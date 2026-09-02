alter table public.food_logs add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.food_logs add column if not exists visibility text not null default 'private';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'food_logs_visibility_check') then
    alter table public.food_logs add constraint food_logs_visibility_check check (visibility in ('private', 'household'));
  end if;
end $$;

update public.food_logs log
set couple_id = member.couple_id
from public.couple_members member
where member.user_id = log.user_id
  and log.couple_id is null;

create index if not exists food_logs_couple_date_idx on public.food_logs(couple_id, consumed_on desc, consumed_at desc);

drop policy if exists food_logs_own on public.food_logs;
drop policy if exists food_logs_select_visible on public.food_logs;
create policy food_logs_select_visible on public.food_logs for select using (
  user_id = auth.uid()
  or (visibility = 'household' and exists (select 1 from public.couple_members where couple_id = food_logs.couple_id and user_id = auth.uid()))
);
drop policy if exists food_logs_insert_own on public.food_logs;
create policy food_logs_insert_own on public.food_logs for insert with check (
  user_id = auth.uid()
  and (visibility = 'private' or exists (select 1 from public.couple_members where couple_id = food_logs.couple_id and user_id = auth.uid()))
);
drop policy if exists food_logs_update_own on public.food_logs;
create policy food_logs_update_own on public.food_logs for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and (visibility = 'private' or exists (select 1 from public.couple_members where couple_id = food_logs.couple_id and user_id = auth.uid()))
);
drop policy if exists food_logs_delete_own on public.food_logs;
create policy food_logs_delete_own on public.food_logs for delete using (user_id = auth.uid());

drop policy if exists food_log_items_own on public.food_log_items;
drop policy if exists food_log_items_visible on public.food_log_items;
drop policy if exists food_log_items_insert_own on public.food_log_items;
drop policy if exists food_log_items_update_own on public.food_log_items;
drop policy if exists food_log_items_delete_own on public.food_log_items;
create policy food_log_items_visible on public.food_log_items for select using (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and (user_id = auth.uid() or (visibility = 'household' and exists (select 1 from public.couple_members where couple_id = food_logs.couple_id and user_id = auth.uid())))));
create policy food_log_items_insert_own on public.food_log_items for insert with check (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and user_id = auth.uid()));
create policy food_log_items_update_own on public.food_log_items for update using (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and user_id = auth.uid())) with check (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and user_id = auth.uid()));
create policy food_log_items_delete_own on public.food_log_items for delete using (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and user_id = auth.uid()));
