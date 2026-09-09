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
import { COLUMN_LABELS, IrisSample, NUMERIC_COLUMNS, summarizeAll } from "@/lib/eda-data";

export function EdaExplorer({ initialRows }: { initialRows: IrisSample[] }) {
  const rows = initialRows;
  const summaries = summarizeAll(rows);

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
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-5">
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          <p className="text-sm">
            No missing values detected — every column in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">eda_samples</code> is
            declared <code className="rounded bg-muted px-1.5 py-0.5 text-xs">not null</code>{" "}
            in the schema.
          </p>
        </div>
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

      <TabsContent value="charts">
        <ChartLab rows={rows} />
      </TabsContent>

      <TabsContent value="data">
        <RawDataTable rows={rows} />
      </TabsContent>
    </Tabs>
  );
}
