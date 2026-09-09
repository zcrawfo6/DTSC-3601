-- DTSC3601 -- Iris Analytics (Next.js + shadcn/ui) dataset
--
-- This is the same `eda_samples` table used by the Python/Streamlit stack in
-- ../../cloud/schema.sql -- both apps read the one table in your Supabase
-- project. If you've already run that file against this project, you do NOT
-- need to run this one too; it's here so the web app is self-contained for
-- anyone setting up Supabase from scratch.
--
-- Run in Supabase: Project -> SQL Editor -> New query -> paste -> Run.

create table if not exists eda_samples (
    id              bigint generated always as identity primary key,
    sepal_length    numeric(6, 2) not null,
    sepal_width     numeric(6, 2) not null,
    petal_length    numeric(6, 2) not null,
    petal_width     numeric(6, 2) not null,
    species         text not null,
    created_at      timestamptz not null default now()
);

create index if not exists idx_eda_samples_species on eda_samples (species);

-- Row Level Security: enabled with a read-only policy for the anon/public
-- key, which is what web/src/lib/supabase.ts uses. Writes (the upload
-- script in ../../cloud/upload_to_supabase.py) use the service_role key,
-- which bypasses RLS.
alter table eda_samples enable row level security;

drop policy if exists "Public read access" on eda_samples;
create policy "Public read access"
    on eda_samples for select
    using (true);
