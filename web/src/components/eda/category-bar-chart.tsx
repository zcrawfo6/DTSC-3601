"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/eda/chart-tooltip";
import { IrisSample, NumericColumn, SPECIES_COLOR, speciesCounts } from "@/lib/eda-data";

export type Aggregation = "count" | "mean" | "sum" | "median" | "min" | "max";

function aggregate(values: number[], agg: Aggregation): number {
  if (agg === "count") return values.length;
  const sorted = [...values].sort((a, b) => a - b);
  switch (agg) {
    case "sum":
      return sorted.reduce((a, b) => a + b, 0);
    case "mean":
      return sorted.reduce((a, b) => a + b, 0) / sorted.length;
    case "median":
      return sorted[Math.floor(sorted.length / 2)];
    case "min":
      return sorted[0];
    case "max":
      return sorted[sorted.length - 1];
  }
}

export function CategoryBarChart({
  rows,
  valueColumn,
  aggregation,
}: {
  rows: IrisSample[];
  valueColumn: NumericColumn | null;
  aggregation: Aggregation;
}) {
  const data = valueColumn
    ? (() => {
        const bySpecies = new Map<string, number[]>();
        for (const r of rows) {
          const list = bySpecies.get(r.species) ?? [];
          list.push(r[valueColumn]);
          bySpecies.set(r.species, list);
        }
        return speciesCounts(rows).map(({ species }) => ({
          species,
          value: aggregate(bySpecies.get(species) ?? [], aggregation),
        }));
      })()
    : speciesCounts(rows).map(({ species, count }) => ({ species, value: count }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="species"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={ChartTooltip} cursor={{ fill: "var(--accent)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={72}>
          {data.map((d) => (
            <Cell key={d.species} fill={SPECIES_COLOR[d.species] ?? "var(--primary)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
