"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/eda/chart-tooltip";
import {
  COLUMN_LABELS,
  IrisSample,
  NumericColumn,
  SPECIES_COLOR,
  SPECIES_ORDER,
} from "@/lib/eda-data";

export function HistogramChart({
  rows,
  column,
  bins,
  colorBySpecies,
}: {
  rows: IrisSample[];
  column: NumericColumn;
  bins: number;
  colorBySpecies: boolean;
}) {
  const values = rows.map((r) => r[column]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 1;

  const buckets = Array.from({ length: bins }, (_, i) => {
    const start = min + i * width;
    const end = i === bins - 1 ? max : start + width;
    const entry: Record<string, number | string> = {
      label: `${start.toFixed(1)}–${end.toFixed(1)}`,
      count: 0,
    };
    for (const s of SPECIES_ORDER) entry[s] = 0;
    return { start, end, entry };
  });

  for (const row of rows) {
    const v = row[column];
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    buckets[idx].entry.count = (buckets[idx].entry.count as number) + 1;
    if (colorBySpecies) {
      buckets[idx].entry[row.species] = ((buckets[idx].entry[row.species] as number) ?? 0) + 1;
    }
  }

  const data = buckets.map((b) => b.entry);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          label={{
            value: COLUMN_LABELS[column],
            position: "insideBottom",
            offset: -4,
            fill: "var(--muted-foreground)",
            fontSize: 12,
          }}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={ChartTooltip} cursor={{ fill: "var(--accent)" }} />
        {colorBySpecies ? (
          <>
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            {SPECIES_ORDER.map((species) => (
              <Bar
                key={species}
                dataKey={species}
                name={species}
                stackId="species"
                fill={SPECIES_COLOR[species]}
                stroke="var(--card)"
                strokeWidth={2}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </>
        ) : (
          <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={44} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
