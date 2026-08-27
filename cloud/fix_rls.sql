-- Run this in Supabase SQL Editor if the anon key reads 0 rows from eda_samples

grant usage on schema public to anon, authenticated;
grant select on eda_samples to anon, authenticated;

alter table eda_samples enable row level security;

drop policy if exists "Public read access" on eda_samples;
create policy "Public read access"
    on eda_samples for select
    to anon, authenticated
    using (true);

-- Verify: should show one row with roles {anon,authenticated} and qual "true"
select policyname, roles, qual from pg_policies where tablename = 'eda_samples';
