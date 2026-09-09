"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ChartTooltip } from "@/components/eda/chart-tooltip";
import {
  COLUMN_LABELS,
  IrisSample,
  NumericColumn,
  SPECIES_COLOR,
  SPECIES_ORDER,
} from "@/lib/eda-data";

// Sequential ramp (light->dark blue), for when "color by" is a numeric
// column rather than the species category — steps 250->550 from the
// dataviz skill's documented sequential ramp, picked for contrast on a
// dark surface.
const SEQUENTIAL_STEPS: [number, number, number][] = [
  [0x86, 0xb6, 0xef], // #86b6ef
  [0x39, 0x87, 0xe5], // #3987e5
  [0x1c, 0x5c, 0xab], // #1c5cab
];

function sequentialColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const seg = clamped * (SEQUENTIAL_STEPS.length - 1);
  const i = Math.min(SEQUENTIAL_STEPS.length - 2, Math.floor(seg));
  const localT = seg - i;
  const [r1, g1, b1] = SEQUENTIAL_STEPS[i];
  const [r2, g2, b2] = SEQUENTIAL_STEPS[i + 1];
  const r = Math.round(r1 + (r2 - r1) * localT);
  const g = Math.round(g1 + (g2 - g1) * localT);
  const b = Math.round(b1 + (b2 - b1) * localT);
  return `rgb(${r}, ${g}, ${b})`;
}

export function ScatterChart({
  rows,
  x,
  y,
  colorBy,
}: {
  rows: IrisSample[];
  x: NumericColumn;
  y: NumericColumn;
  colorBy: "none" | "species" | NumericColumn;
}) {
  const axisStyle = { fill: "var(--muted-foreground)", fontSize: 11 };

  if (colorBy === "species") {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <RechartsScatterChart margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey={x}
            name={COLUMN_LABELS[x]}
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            label={{ value: COLUMN_LABELS[x], position: "insideBottom", offset: -4, ...axisStyle }}
          />
          <YAxis
            type="number"
            dataKey={y}
            name={COLUMN_LABELS[y]}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            label={{ value: COLUMN_LABELS[y], angle: -90, position: "insideLeft", ...axisStyle }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip content={ChartTooltip} cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
          {SPECIES_ORDER.map((species) => (
            <Scatter
              key={species}
              name={species}
              data={rows.filter((r) => r.species === species)}
              fill={SPECIES_COLOR[species]}
              fillOpacity={0.85}
            />
          ))}
        </RechartsScatterChart>
      </ResponsiveContainer>
    );
  }

  const colorValues = colorBy !== "none" ? rows.map((r) => r[colorBy]) : [];
  const min = colorValues.length ? Math.min(...colorValues) : 0;
  const max = colorValues.length ? Math.max(...colorValues) : 1;

  const data = rows.map((r) => ({
    ...r,
    fill:
      colorBy === "none"
        ? "var(--primary)"
        : sequentialColor(max === min ? 0.5 : (r[colorBy] - min) / (max - min)),
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RechartsScatterChart margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="var(--border)" />
        <XAxis
          type="number"
          dataKey={x}
          name={COLUMN_LABELS[x]}
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          label={{ value: COLUMN_LABELS[x], position: "insideBottom", offset: -4, ...axisStyle }}
        />
        <YAxis
          type="number"
          dataKey={y}
          name={COLUMN_LABELS[y]}
          tick={axisStyle}
          tickLine={false}
          axisLine={false}
          label={{ value: COLUMN_LABELS[y], angle: -90, position: "insideLeft", ...axisStyle }}
        />
        <ZAxis range={[60, 60]} />
        <Tooltip content={ChartTooltip} cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }} />
        <Scatter data={data} shape={<ColoredDot />} />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: { fill?: string };
};

function ColoredDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  return <circle cx={cx} cy={cy} r={5} fill={payload?.fill ?? "var(--primary)"} fillOpacity={0.85} />;
}
