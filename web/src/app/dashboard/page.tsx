import { AlertTriangle } from "lucide-react";
import { EdaExplorer } from "@/components/eda/eda-explorer";
import { fetchSamples } from "@/lib/eda-data";

export const revalidate = 60;

export default async function DashboardPage() {
  let rows: Awaited<ReturnType<typeof fetchSamples>> = [];
  let error: string | null = null;

  try {
    rows = await fetchSamples();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-destructive">
              Couldn&apos;t load data from Supabase
            </p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-muted-foreground">
              Copy <code className="rounded bg-muted px-1 py-0.5">.env.local.example</code>{" "}
              to <code className="rounded bg-muted px-1 py-0.5">.env.local</code>, fill in
              your Supabase project&apos;s URL and anon key, and make sure{" "}
              <code className="rounded bg-muted px-1 py-0.5">supabase/schema.sql</code> has
              been run against that project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-lg font-medium">No rows in `eda_samples` yet.</p>
        <p className="mt-2 text-muted-foreground">
          Run{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            uv run python cloud/upload_to_supabase.py
          </code>{" "}
          from the repo root to seed the sample dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Exploratory data analysis
        </h1>
        <p className="text-muted-foreground">
          Live from Supabase · {rows.length.toLocaleString()} rows · refreshed
          every 60s
        </p>
      </div>
      <EdaExplorer initialRows={rows} />
    </div>
  );
}
