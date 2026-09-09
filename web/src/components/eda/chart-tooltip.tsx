import type { TooltipContentProps } from "recharts";

type Payload = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

// A shadcn-styled replacement for recharts' default tooltip — same card
// surface/border as the rest of the UI instead of the library default.
export function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      {label !== undefined && (
        <div className="mb-1 font-medium text-popover-foreground">{label}</div>
      )}
      <div className="space-y-0.5">
        {(payload as unknown as Payload[]).map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            {entry.color && (
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span>{entry.name ?? entry.dataKey}:</span>
            <span className="font-medium tabular-nums text-foreground">
              {typeof entry.value === "number" ? round(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function round(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
