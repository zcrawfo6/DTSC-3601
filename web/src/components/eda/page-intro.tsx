import { Sparkles } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/**
 * Standard header for each EDA tab: a one-line purpose statement plus a
 * data-driven "what the data shows" callout. Numbers in `insight` should
 * come from the actual rows/summaries computed in eda-explorer.tsx rather
 * than being hardcoded, so the text stays accurate if eda_samples changes.
 */
export function PageIntro({
  purpose,
  insight,
  icon: Icon = Sparkles,
}: {
  purpose: ReactNode;
  insight: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">{purpose}</p>
      <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
        <Icon className="size-4.5 shrink-0 text-primary" />
        <p className="text-sm">
          <span className="font-medium text-foreground">What the data shows: </span>
          {insight}
        </p>
      </div>
    </div>
  );
}
