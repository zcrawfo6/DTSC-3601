"use client";

import { useState } from "react";
import {
  boxStatsBySpecies,
  COLUMN_LABELS,
  IrisSample,
  NumericColumn,
  SPECIES_COLOR,
} from "@/lib/eda-data";

// recharts has no native box-plot mark, so this is a small hand-rolled SVG
// box plot — min/max whiskers, an IQR box, and a median line — grouped by
// species using the same fixed colors/order as every other chart here.
const WIDTH = 720;
const HEIGHT = 360;
const MARGIN = { top: 16, right: 24, bottom: 32, left: 48 };

export function BoxPlotChart({
  rows,
  column,
}: {
  rows: IrisSample[];
  column: NumericColumn;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const groups = boxStatsBySpecies(rows, column);

  const allValues = groups.flatMap((g) => [g.min, g.max]);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const pad = (dataMax - dataMin) * 0.1 || 1;
  const yMin = dataMin - pad;
  const yMax = dataMax + pad;

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const yScale = (v: number) =>
    MARGIN.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const bandWidth = plotWidth / groups.length;
  const boxWidth = Math.min(72, bandWidth * 0.5);

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full min-w-[420px]" role="img" aria-label={`Box plot of ${COLUMN_LABELS[column]} by species`}>
        {/* gridlines + y ticks */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="var(--border)"
            />
            <text
              x={MARGIN.left - 8}
              y={yScale(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {groups.map((g, i) => {
          const cx = MARGIN.left + bandWidth * i + bandWidth / 2;
          const color = SPECIES_COLOR[g.group] ?? "var(--primary)";
          const isHovered = hovered === g.group;
          return (
            <g
              key={g.group}
              onMouseEnter={() => setHovered(g.group)}
              onMouseLeave={() => setHovered(null)}
              opacity={hovered && !isHovered ? 0.45 : 1}
              style={{ transition: "opacity 120ms ease" }}
            >
              {/* whisker */}
              <line x1={cx} x2={cx} y1={yScale(g.min)} y2={yScale(g.max)} stroke={color} strokeWidth={2} />
              <line x1={cx - 10} x2={cx + 10} y1={yScale(g.min)} y2={yScale(g.min)} stroke={color} strokeWidth={2} />
              <line x1={cx - 10} x2={cx + 10} y1={yScale(g.max)} y2={yScale(g.max)} stroke={color} strokeWidth={2} />
              {/* IQR box */}
              <rect
                x={cx - boxWidth / 2}
                y={yScale(g.q3)}
                width={boxWidth}
                height={Math.max(1, yScale(g.q1) - yScale(g.q3))}
                fill={color}
                fillOpacity={0.25}
                stroke={color}
                strokeWidth={2}
                rx={4}
              />
              {/* median */}
              <line
                x1={cx - boxWidth / 2}
                x2={cx + boxWidth / 2}
                y1={yScale(g.median)}
                y2={yScale(g.median)}
                stroke={color}
                strokeWidth={2.5}
              />
              {/* x label */}
              <text
                x={cx}
                y={HEIGHT - MARGIN.bottom + 20}
                textAnchor="middle"
                fontSize={12}
                fill="var(--foreground)"
              >
                {g.group}
              </text>
              {isHovered && (
                <text
                  x={cx}
                  y={yScale(g.max) - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--muted-foreground)"
                >
                  median {g.median.toFixed(2)} · IQR {g.q1.toFixed(2)}–{g.q3.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
