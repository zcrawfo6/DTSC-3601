"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/eda/chart-tooltip";
import { COLUMN_LABELS, IrisSample, NumericColumn, SPECIES_COLOR, SPECIES_ORDER } from "@/lib/eda-data";

export function TrendLineChart({
  rows,
  column,
  colorBySpecies,
}: {
  rows: IrisSample[];
  column: NumericColumn;
  colorBySpecies: boolean;
}) {
  const sorted = [...rows].sort((a, b) => a.id - b.id);

  if (!colorBySpecies) {
    const data = sorted.map((r) => ({ id: r.id, value: r[column] }));
    return (
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="id" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
          <Line type="monotone" dataKey="value" name={COLUMN_LABELS[column]} stroke="var(--primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // One series per species, still indexed by row id — a gap where a species
  // has no row at that id is left null so the fixed color stays tied to identity.
  const data = sorted.map((r) => {
    const entry: Record<string, number | null> = { id: r.id };
    for (const s of SPECIES_ORDER) entry[s] = r.species === s ? r[column] : null;
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="id" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        {SPECIES_ORDER.map((s) => (
          <Line key={s} type="monotone" dataKey={s} name={s} stroke={SPECIES_COLOR[s]} strokeWidth={2} dot={false} connectNulls={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
