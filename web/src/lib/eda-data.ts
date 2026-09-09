import { supabase } from "@/lib/supabase";

export type IrisSample = {
  id: number;
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
  species: string;
};

export const NUMERIC_COLUMNS = [
  "sepal_length",
  "sepal_width",
  "petal_length",
  "petal_width",
] as const;

export type NumericColumn = (typeof NUMERIC_COLUMNS)[number];

export const COLUMN_LABELS: Record<NumericColumn, string> = {
  sepal_length: "Sepal length",
  sepal_width: "Sepal width",
  petal_length: "Petal length",
  petal_width: "Petal width",
};

// Fixed categorical order — matches the CVD-validated color assignment in
// globals.css (--chart-1/2/3). Never derive this order from query results.
export const SPECIES_ORDER = ["setosa", "versicolor", "virginica"] as const;

export const SPECIES_COLOR: Record<string, string> = {
  setosa: "var(--chart-1)",
  versicolor: "var(--chart-2)",
  virginica: "var(--chart-3)",
};

export async function fetchSamples(): Promise<IrisSample[]> {
  const { data, error } = await supabase
    .from("eda_samples")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to load eda_samples from Supabase: ${error.message}`);
  }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Summary statistics (mirrors pandas' df.describe() from the original
// Streamlit EDA explorer, computed client-side since there's no pandas here)
// ---------------------------------------------------------------------------
export type ColumnSummary = {
  column: NumericColumn;
  count: number;
  mean: number;
  std: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function summarizeColumn(values: number[], column: NumericColumn): ColumnSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1 || 1);
  return {
    column,
    count: n,
    mean,
    std: Math.sqrt(variance),
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[n - 1],
  };
}

export function summarizeAll(rows: IrisSample[]): ColumnSummary[] {
  return NUMERIC_COLUMNS.map((col) => summarizeColumn(rows.map((r) => r[col]), col));
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((x, y) => x + y, 0) / n;
  const meanB = b.reduce((x, y) => x + y, 0) / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  const denom = Math.sqrt(varA * varB);
  return denom === 0 ? 0 : cov / denom;
}

export function correlationMatrix(rows: IrisSample[]): number[][] {
  const columns = NUMERIC_COLUMNS.map((col) => rows.map((r) => r[col]));
  return columns.map((a) => columns.map((b) => pearsonCorrelation(a, b)));
}

export function speciesCounts(rows: IrisSample[]): { species: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.species, (counts.get(row.species) ?? 0) + 1);
  return SPECIES_ORDER.filter((s) => counts.has(s)).map((species) => ({
    species,
    count: counts.get(species)!,
  }));
}

// Box-plot five-number summary, grouped by species — drives the custom SVG
// box plot (recharts has no native box-plot mark).
export type BoxStats = {
  group: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

export function boxStatsBySpecies(rows: IrisSample[], column: NumericColumn): BoxStats[] {
  const bySpecies = new Map<string, number[]>();
  for (const row of rows) {
    const list = bySpecies.get(row.species) ?? [];
    list.push(row[column]);
    bySpecies.set(row.species, list);
  }
  return SPECIES_ORDER.filter((s) => bySpecies.has(s)).map((species) => {
    const sorted = [...bySpecies.get(species)!].sort((a, b) => a - b);
    return {
      group: species,
      min: sorted[0],
      q1: quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      q3: quantile(sorted, 0.75),
      max: sorted[sorted.length - 1],
    };
  });
}
