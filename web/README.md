# Iris Analytics

An interactive exploratory-data-analysis dashboard for the Iris flower
measurement dataset — the same dataset used by the Streamlit app at the repo
root, rebuilt here as a [Next.js](https://nextjs.org) site with
[shadcn/ui](https://ui.shadcn.com) components, reading live from
[Supabase](https://supabase.com), and deployed on [Vercel](https://vercel.com).

- **`/`** — landing page with live dataset stats.
- **`/dashboard`** — the EDA explorer: overview, summary statistics, a
  missing-values audit, a build-your-own chart lab (histogram, scatter, box
  plot, bar chart, correlation heatmap, line chart), and a searchable raw
  data table.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| UI components | shadcn/ui (Base UI primitives) |
| Charts | Recharts + a couple of hand-rolled SVG charts (box plot, correlation heatmap) |
| Data | Supabase (Postgres), read via `@supabase/supabase-js` with the anon key |
| Hosting | Vercel, deployed from this GitHub repo |

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com) (or reuse the
     one already backing the Streamlit app in this repo).
   - Run `supabase/schema.sql` in the Supabase SQL editor to create the
     `eda_samples` table (skip this if `../cloud/schema.sql` has already been
     run against the same project — it's the same table).
   - Seed it with data: `uv run python ../cloud/upload_to_supabase.py` from
     the repo root (needs `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in a
     `.env` there — see that script's docstring).

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from your Supabase project's **Project Settings → Data API**. The anon
   key is safe to expose to the browser — the `eda_samples` table only
   grants it `SELECT` via the RLS policy in `supabase/schema.sql`.

4. **Run it**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploying on Vercel

1. Push this repo to GitHub (already done if you're reading this from the
   repo).
2. In Vercel, **Add New → Project**, import the GitHub repo, and set the
   **Root Directory** to `web/` (this is a subfolder of the DTSC-3601 repo,
   not the repo root).
3. Add the same two environment variables from step 3 above under
   **Project Settings → Environment Variables**.
4. Deploy. Every push to the connected branch redeploys automatically.

## Design

The site runs a single dark theme (no light-mode toggle) — near-black
surfaces, a lime-green brand accent, defined as CSS custom properties in
`src/app/globals.css`. Chart colors are a separate, CVD-validated
categorical palette (see the comments in `src/lib/eda-data.ts` and
`src/components/eda/correlation-heatmap.tsx`) so the brand accent never
doubles as a data-series color.
