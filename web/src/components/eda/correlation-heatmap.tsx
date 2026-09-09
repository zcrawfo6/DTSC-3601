"use client";

import { COLUMN_LABELS, correlationMatrix, IrisSample, NUMERIC_COLUMNS } from "@/lib/eda-data";

// Diverging pair (blue <-> red) with a neutral gray midpoint, per the
// dataviz skill's diverging-palette rule — correlation is a polarity
// (negative/positive), never a magnitude, so it never gets a single-hue
// sequential ramp or a rainbow.
const BLUE: [number, number, number] = [0x39, 0x87, 0xe5];
const GRAY: [number, number, number] = [0x38, 0x38, 0x35];
const RED: [number, number, number] = [0xe6, 0x67, 0x67];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function divergingColor(value: number): string {
  const t = (value + 1) / 2; // -1..1 -> 0..1
  const [from, to, localT] =
    t < 0.5 ? [BLUE, GRAY, t / 0.5] : [GRAY, RED, (t - 0.5) / 0.5];
  const r = lerp(from[0], to[0], localT);
  const g = lerp(from[1], to[1], localT);
  const b = lerp(from[2], to[2], localT);
  return `rgb(${r}, ${g}, ${b})`;
}

export function CorrelationHeatmap({ rows }: { rows: IrisSample[] }) {
  const matrix = correlationMatrix(rows);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `140px repeat(${NUMERIC_COLUMNS.length}, minmax(84px, 1fr))`,
          }}
        >
          <div />
          {NUMERIC_COLUMNS.map((col) => (
            <div
              key={col}
              className="flex items-end justify-center pb-1 text-center text-xs text-muted-foreground"
            >
              {COLUMN_LABELS[col]}
            </div>
          ))}

          {NUMERIC_COLUMNS.map((rowCol, i) => (
            <div key={rowCol} className="contents">
              <div className="flex items-center justify-end pr-3 text-xs text-muted-foreground">
                {COLUMN_LABELS[rowCol]}
              </div>
              {NUMERIC_COLUMNS.map((colCol, j) => {
                const value = matrix[i][j];
                return (
                  <div
                    key={colCol}
                    className="flex aspect-square items-center justify-center rounded-md text-sm font-medium tabular-nums"
                    style={{
                      backgroundColor: divergingColor(value),
                      color: Math.abs(value) > 0.55 ? "#ffffff" : "var(--foreground)",
                    }}
                    title={`${COLUMN_LABELS[rowCol]} vs ${COLUMN_LABELS[colCol]}: ${value.toFixed(2)}`}
                  >
                    {value.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>−1</span>
          <div
            className="h-2 w-40 rounded-full"
            style={{
              background:
                "linear-gradient(to right, rgb(57,135,229), rgb(56,56,53), rgb(230,103,103))",
            }}
          />
          <span>+1</span>
          <span className="ml-2">Pearson correlation</span>
        </div>
      </div>
    </div>
  );
}
