import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Database, LineChart, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchSamples, NUMERIC_COLUMNS, speciesCounts } from "@/lib/eda-data";

async function getHeroStats() {
  try {
    const rows = await fetchSamples();
    return {
      rowCount: rows.length,
      speciesCount: speciesCounts(rows).length,
      ready: true as const,
    };
  } catch {
    return { rowCount: 0, speciesCount: 0, ready: false as const };
  }
}

export default async function Home() {
  const stats = await getHeroStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60rem 30rem at 15% -10%, color-mix(in oklab, var(--primary) 16%, transparent), transparent), radial-gradient(40rem 24rem at 100% 0%, color-mix(in oklab, var(--chart-3) 14%, transparent), transparent)",
          }}
        />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:px-6 sm:py-28">
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-primary/30 bg-primary/10 text-primary"
          >
            DTSC 3601 · Live Supabase dataset
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Explore the Iris dataset,{" "}
            <span className="text-primary">on the pitch of data.</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            A full exploratory-data-analysis dashboard — summary stats, missing
            values, and a build-your-own chart lab — reading live from a
            Postgres table on Supabase and rendered with shadcn/ui.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="gap-2"
              render={
                <Link href="/dashboard">
                  Open the dashboard <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button size="lg" variant="outline" render={<a href="#about">How it&apos;s built</a>} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatPill
              label="Rows"
              value={stats.ready ? stats.rowCount.toLocaleString() : "—"}
            />
            <StatPill
              label="Species"
              value={stats.ready ? String(stats.speciesCount) : "—"}
            />
            <StatPill label="Numeric columns" value={String(NUMERIC_COLUMNS.length)} />
            <StatPill label="Data source" value="Supabase" />
          </div>
          {!stats.ready && (
            <p className="text-sm text-destructive">
              Couldn&apos;t reach Supabase — set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see
              .env.local.example).
            </p>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            One dataset, three ways to look at it
          </h2>
          <p className="mt-2 text-muted-foreground">
            The dashboard mirrors a real EDA workflow: understand the shape of
            the data, check its quality, then build the chart that answers
            your question.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Table2 className="size-5" />}
            title="Overview & quality"
            description="Row/column counts, per-column types, summary statistics, and a missing-value audit — the first five minutes of any EDA."
          />
          <FeatureCard
            icon={<LineChart className="size-5" />}
            title="Chart lab"
            description="Histograms, scatter plots, box plots by species, bar charts, a correlation heatmap, and line charts — pick the axes, get the chart."
          />
          <FeatureCard
            icon={<Database className="size-5" />}
            title="Live Supabase data"
            description="Every number on this site is read at request time from a Postgres table on Supabase via a read-only, RLS-protected anon key."
          />
        </div>

        <Card className="mt-10 border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle>About the dataset</CardTitle>
            <CardDescription>
              Sepal and petal measurements (in cm) for 200 synthetic iris
              flowers across three species — setosa, versicolor, and
              virginica — generated for this course project and stored in the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                eda_samples
              </code>{" "}
              table.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {NUMERIC_COLUMNS.map((c) => (
              <Badge key={c} variant="secondary" className="font-normal">
                {c}
              </Badge>
            ))}
            <Badge variant="secondary" className="font-normal">
              species
            </Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader>
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
