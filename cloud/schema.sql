-- DTSC3601 - CSV EDA Explorer sample dataset
-- Run this in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create table if not exists eda_samples (
    id              bigint generated always as identity primary key,
    sepal_length    numeric(6, 2) not null,
    sepal_width     numeric(6, 2) not null,
    petal_length    numeric(6, 2) not null,
    petal_width     numeric(6, 2) not null,
    species         text not null
);

create index if not exists idx_eda_samples_species on eda_samples (species);

-- Row Level Security: enabled with a read-only policy for the anon/public key.
-- Writes (the upload script) use the service_role key, which bypasses RLS.
alter table eda_samples enable row level security;

drop policy if exists "Public read access" on eda_samples;
create policy "Public read access"
    on eda_samples for select
    using (true);
