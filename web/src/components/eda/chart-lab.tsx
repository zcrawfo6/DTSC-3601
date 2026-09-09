"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistogramChart } from "@/components/eda/histogram-chart";
import { ScatterChart } from "@/components/eda/scatter-chart";
import { BoxPlotChart } from "@/components/eda/box-plot-chart";
import { CategoryBarChart, type Aggregation } from "@/components/eda/category-bar-chart";
import { CorrelationHeatmap } from "@/components/eda/correlation-heatmap";
import { TrendLineChart } from "@/components/eda/trend-line-chart";
import { COLUMN_LABELS, IrisSample, NUMERIC_COLUMNS, NumericColumn } from "@/lib/eda-data";

const CHART_TYPES = [
  "Histogram",
  "Scatter plot",
  "Box plot",
  "Bar chart",
  "Correlation heatmap",
  "Line chart",
] as const;
type ChartType = (typeof CHART_TYPES)[number];

const NONE = "__none__";

function ColumnSelect({
  value,
  onChange,
  label,
}: {
  value: NumericColumn;
  onChange: (v: NumericColumn) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as NumericColumn)}>
        <SelectTrigger size="sm" className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {NUMERIC_COLUMNS.map((c) => (
            <SelectItem key={c} value={c}>
              {COLUMN_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ChartLab({ rows }: { rows: IrisSample[] }) {
  const [chartType, setChartType] = useState<ChartType>("Scatter plot");

  const [histColumn, setHistColumn] = useState<NumericColumn>("petal_length");
  const [histBins, setHistBins] = useState(20);
  const [histColorBySpecies, setHistColorBySpecies] = useState(true);

  const [scatterX, setScatterX] = useState<NumericColumn>("sepal_length");
  const [scatterY, setScatterY] = useState<NumericColumn>("petal_length");
  const [scatterColorBy, setScatterColorBy] = useState<string>("species");

  const [boxColumn, setBoxColumn] = useState<NumericColumn>("petal_width");

  const [barValueColumn, setBarValueColumn] = useState<string>(NONE);
  const [barAgg, setBarAgg] = useState<Aggregation>("mean");

  const [lineColumn, setLineColumn] = useState<NumericColumn>("sepal_length");
  const [lineColorBySpecies, setLineColorBySpecies] = useState(true);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Chart type</Label>
        <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">{chartType}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {chartType === "Histogram" && (
            <>
              <div className="flex flex-wrap items-end gap-4">
                <ColumnSelect value={histColumn} onChange={setHistColumn} label="Column" />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Color by</Label>
                  <Select
                    value={histColorBySpecies ? "species" : NONE}
                    onValueChange={(v) => setHistColorBySpecies(v === "species")}
                  >
                    <SelectTrigger size="sm" className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      <SelectItem value="species">Species</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-1.5 sm:w-56">
                  <Label className="text-xs text-muted-foreground">Bins: {histBins}</Label>
                  <Slider
                    min={5}
                    max={50}
                    step={1}
                    value={[histBins]}
                    onValueChange={(v) => setHistBins(Array.isArray(v) ? v[0] : v)}
                  />
                </div>
              </div>
              <HistogramChart rows={rows} column={histColumn} bins={histBins} colorBySpecies={histColorBySpecies} />
            </>
          )}

          {chartType === "Scatter plot" && (
            <>
              <div className="flex flex-wrap items-end gap-4">
                <ColumnSelect value={scatterX} onChange={setScatterX} label="X axis" />
                <ColumnSelect value={scatterY} onChange={setScatterY} label="Y axis" />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Color by</Label>
                  <Select value={scatterColorBy} onValueChange={(v) => v && setScatterColorBy(v)}>
                    <SelectTrigger size="sm" className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      <SelectItem value="species">Species</SelectItem>
                      {NUMERIC_COLUMNS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {COLUMN_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ScatterChart
                rows={rows}
                x={scatterX}
                y={scatterY}
                colorBy={scatterColorBy === NONE ? "none" : (scatterColorBy as "species" | NumericColumn)}
              />
            </>
          )}

          {chartType === "Box plot" && (
            <>
              <div className="flex flex-wrap items-end gap-4">
                <ColumnSelect value={boxColumn} onChange={setBoxColumn} label="Numeric column" />
                <p className="text-xs text-muted-foreground">Grouped by species</p>
              </div>
              <BoxPlotChart rows={rows} column={boxColumn} />
            </>
          )}

          {chartType === "Bar chart" && (
            <>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Select value={barValueColumn} onValueChange={(v) => v && setBarValueColumn(v)}>
                    <SelectTrigger size="sm" className="w-full sm:w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Count of rows</SelectItem>
                      {NUMERIC_COLUMNS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {COLUMN_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {barValueColumn !== NONE && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Aggregation</Label>
                    <Select value={barAgg} onValueChange={(v) => setBarAgg(v as Aggregation)}>
                      <SelectTrigger size="sm" className="w-full sm:w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["mean", "sum", "median", "min", "max"] as Aggregation[]).map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <CategoryBarChart
                rows={rows}
                valueColumn={barValueColumn === NONE ? null : (barValueColumn as NumericColumn)}
                aggregation={barValueColumn === NONE ? "count" : barAgg}
              />
            </>
          )}

          {chartType === "Correlation heatmap" && <CorrelationHeatmap rows={rows} />}

          {chartType === "Line chart" && (
            <>
              <div className="flex flex-wrap items-end gap-4">
                <ColumnSelect value={lineColumn} onChange={setLineColumn} label="Y axis (by row order)" />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Color by</Label>
                  <Select
                    value={lineColorBySpecies ? "species" : NONE}
                    onValueChange={(v) => setLineColorBySpecies(v === "species")}
                  >
                    <SelectTrigger size="sm" className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      <SelectItem value="species">Species</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <TrendLineChart rows={rows} column={lineColumn} colorBySpecies={lineColorBySpecies} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
