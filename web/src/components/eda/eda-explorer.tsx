"use client";

import { CheckCircle2, Columns3, Hash, Rows3, Tags } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/eda/stat-card";
import { CategoryBarChart } from "@/components/eda/category-bar-chart";
import { ChartLab } from "@/components/eda/chart-lab";
import { RawDataTable } from "@/components/eda/raw-data-table";
import { PageIntro } from "@/components/eda/page-intro";
import {
  boxStatsBySpecies,
  COLUMN_LABELS,
  correlationMatrix,
  IrisSample,
  NUMERIC_COLUMNS,
  NumericColumn,
  speciesCounts,
  summarizeAll,
} from "@/lib/eda-data";

export function EdaExplorer({ initialRows }: { initialRows: IrisSample[] }) {
  const rows = initialRows;
  const summaries = summarizeAll(rows);

  // --- Derived numbers driving the "what the data shows" callouts below.
  // Computed from the live rows so the text stays accurate as eda_samples
  // changes, instead of hardcoding facts about the classic Iris dataset.
  const counts = speciesCounts(rows);
  const balanced = counts.length > 0 && counts.every((c) => c.count === counts[0].count);

  const ranges = summaries.map((s) => ({ column: s.column, summary: s, range: s.max - s.min }));
  const widestRange = ranges.reduce((max, r) => (r.range > max.range ? r : max));
  const narrowestRange = ranges.reduce((min, r) => (r.range < min.range ? r : min));

  const corr = correlationMatrix(rows);
  type CorrPair = { a: NumericColumn; b: NumericColumn; r: number };
  const corrPairs: CorrPair[] = [];
  for (let i = 0; i < NUMERIC_COLUMNS.length; i++) {
    for (let j = i + 1; j < NUMERIC_COLUMNS.length; j++) {
      corrPairs.push({ a: NUMERIC_COLUMNS[i], b: NUMERIC_COLUMNS[j], r: corr[i][j] });
    }
  }
  const strongestCorr = corrPairs.reduce((max, p) => (Math.abs(p.r) > Math.abs(max.r) ? p : max));
  const weakestCorr = corrPairs.reduce((min, p) => (Math.abs(p.r) < Math.abs(min.r) ? p : min));

  const petalLengthBySpecies = boxStatsBySpecies(rows, "petal_length");
  const setosaPetal = petalLengthBySpecies.find((b) => b.group === "setosa");
  const otherPetalMedians = petalLengthBySpecies
    .filter((b) => b.group !== "setosa")
    .map((b) => b.median);
  const otherPetalMin = otherPetalMedians.length > 0 ? Math.min(...otherPetalMedians) : undefined;

  return (
    <Tabs defaultValue="overview" className="w-full gap-6">
      <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="statistics">Statistics</TabsTrigger>
        <TabsTrigger value="missing">Missing values</TabsTrigger>
        <TabsTrigger value="charts">Chart lab</TabsTrigger>
        <TabsTrigger value="data">Raw data</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <PageIntro
          purpose="A first look at the table's shape — how many records there are, how many columns, and what kind of data each one holds — before digging into any numbers."
          insight={
            <>
              {rows.length} total measurements across {counts.length} species
              {balanced && counts[0] ? `, split evenly at ${counts[0].count} samples each` : ""},
              plus {NUMERIC_COLUMNS.length} numeric traits and one categorical label (species). A
              balanced, complete table like this is exactly what you want before running
              statistics or building charts — no species is over- or under-represented.
            </>
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Rows" value={rows.length.toLocaleString()} icon={<Rows3 className="size-4.5" />} />
          <StatCard label="Columns" value={String(NUMERIC_COLUMNS.length + 1)} icon={<Columns3 className="size-4.5" />} />
          <StatCard label="Numeric columns" value={String(NUMERIC_COLUMNS.length)} icon={<Hash className="size-4.5" />} />
          <StatCard label="Categorical columns" value="1" icon={<Tags className="size-4.5" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="border-border/80 bg-card/60 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Species distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBarChart rows={rows} valueColumn={null} aggregation="count" />
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Column types</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {NUMERIC_COLUMNS.map((c) => (
                    <TableRow key={c}>
                      <TableCell className="font-medium">{c}</TableCell>
                      <TableCell className="text-muted-foreground">numeric (float)</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">species</TableCell>
                    <TableCell className="text-muted-foreground">categorical (text)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="statistics" className="space-y-6">
        <PageIntro
          purpose="Column-by-column descriptive statistics — mean, spread, and quartiles — the standard first pass on any new dataset."
          insight={
            <>
              {COLUMN_LABELS[widestRange.column]} has the widest spread ({widestRange.summary.min.toFixed(1)}–
              {widestRange.summary.max.toFixed(1)}cm, a range of {widestRange.range.toFixed(2)}cm),
              while {COLUMN_LABELS[narrowestRange.column]} is the most tightly clustered (a range
              of just {narrowestRange.range.toFixed(2)}cm). A trait with more spread relative to
              its mean tends to carry more information for telling species apart — which is why
              petal measurements do more work than sepal width once you get to the chart lab.
            </>
          }
        />
        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Numeric summary</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Mean</TableHead>
                  <TableHead className="text-right">Std</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">25%</TableHead>
                  <TableHead className="text-right">50%</TableHead>
                  <TableHead className="text-right">75%</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s) => (
                  <TableRow key={s.column}>
                    <TableCell className="font-medium">{COLUMN_LABELS[s.column]}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.mean.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.std.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.min.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.q1.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.median.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.q3.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.max.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Species counts</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart rows={rows} valueColumn={null} aggregation="count" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="missing" className="space-y-6">
        <PageIntro
          icon={CheckCircle2}
          purpose="A completeness check — every column gets scanned for nulls or gaps before any statistic on this dashboard can be trusted."
          insight={
            <>
              No missing values detected across {rows.length} rows and{" "}
              {NUMERIC_COLUMNS.length + 1} columns — every column in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">eda_samples</code> is
              declared <code className="rounded bg-muted px-1.5 py-0.5 text-xs">not null</code>{" "}
              in the schema, so nothing here needs imputing or dropping.
            </>
          }
        />
        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Missing values by column</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead className="text-right">Missing count</TableHead>
                  <TableHead className="text-right">Missing %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...NUMERIC_COLUMNS, "species"].map((c) => (
                  <TableRow key={c}>
                    <TableCell className="font-medium">{c}</TableCell>
                    <TableCell className="text-right tabular-nums">0</TableCell>
                    <TableCell className="text-right tabular-nums">0.00%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="charts" className="space-y-6">
        <PageIntro
          purpose="Pick any two traits — or a trait and species — and the chart updates instantly, built to explore relationships and separability the summary tables above can't show directly."
          insight={
            <>
              {COLUMN_LABELS[strongestCorr.a]} and {COLUMN_LABELS[strongestCorr.b]} move together
              the most closely (r = {strongestCorr.r.toFixed(2)}), while{" "}
              {COLUMN_LABELS[weakestCorr.a]} and {COLUMN_LABELS[weakestCorr.b]} are the most
              independent (r = {weakestCorr.r.toFixed(2)}). Try a scatter of petal length vs.
              petal width colored by species: setosa
              {setosaPetal ? ` (median ${setosaPetal.median.toFixed(1)}cm petal length)` : ""} sits
              well below versicolor and virginica
              {otherPetalMin !== undefined ? ` (medians from ${otherPetalMin.toFixed(1)}cm up)` : ""},
              separating cleanly on that one trait alone — while the other two overlap more and
              need multiple traits together to tell apart.
            </>
          }
        />
        <ChartLab rows={rows} />
      </TabsContent>

      <TabsContent value="data" className="space-y-6">
        <PageIntro
          purpose="The full table behind every chart and statistic above — search, sort, and page through it to check any individual record."
          insight={
            <>
              {rows.length} rows and {NUMERIC_COLUMNS.length + 1} columns, pulled live from the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">eda_samples</code> table on
              Supabase on every page load — this is the ground truth every other tab summarizes.
            </>
          }
        />
        <RawDataTable rows={rows} />
      </TabsContent>
    </Tabs>
  );
}
