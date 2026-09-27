"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Radar, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPECIES_COLOR } from "@/lib/eda-data";
import {
  ApiError,
  getPipelineInfo,
  MEASUREMENTS,
  PIPELINE_API_URL,
  predict,
  type Flower,
  type PipelineInfo,
  type Prediction,
} from "@/lib/pipeline-api";

const PRESETS: { label: string; flower: Flower }[] = [
  { label: "Setosa-like", flower: { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 } },
  { label: "Versicolor-like", flower: { sepal_length: 5.9, sepal_width: 3.0, petal_length: 4.2, petal_width: 1.5 } },
  { label: "Virginica-like", flower: { sepal_length: 6.5, sepal_width: 3.0, petal_length: 5.8, petal_width: 2.2 } },
  { label: "Odd one", flower: { sepal_length: 5.0, sepal_width: 3.4, petal_length: 6.5, petal_width: 0.2 } },
];

type FormValues = Record<keyof Flower, string>;

const toForm = (f: Flower): FormValues =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v)])) as FormValues;

export function Predictor() {
  const [values, setValues] = useState<FormValues>(toForm(PRESETS[1].flower));
  const [result, setResult] = useState<Prediction | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<PipelineInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  useEffect(() => {
    getPipelineInfo()
      .then(setInfo)
      .catch((e) => setInfoError(e instanceof Error ? e.message : String(e)));
  }, []);

  async function submit(flower?: Flower) {
    setLoading(true);
    setError(null);
    try {
      // Send the raw numbers as typed; the API's Pydantic bounds do the
      // validation, so out-of-range input comes back as a real 422.
      const body = flower ?? (Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : Number(v)]),
      ) as Flower);
      setResult(await predict(body));
    } catch (e) {
      setResult(null);
      setError(
        e instanceof ApiError
          ? { status: e.status, message: e.message }
          : { status: 0, message: `Couldn't reach the API (${e instanceof Error ? e.message : e})` },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Measure a flower</CardTitle>
            <CardDescription>Centimetres. Values go to the live API unmodified.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValues(toForm(p.flower));
                    submit(p.flower);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <form
              className="grid grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {MEASUREMENTS.map((m) => (
                <div key={m.key} className="space-y-1.5">
                  <Label htmlFor={m.key}>{m.label}</Label>
                  <Input
                    id={m.key}
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={values[m.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
                  />
                </div>
              ))}
              <Button type="submit" className="col-span-2" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Classify
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Artifact</CardTitle>
            <CardDescription className="break-all font-mono text-xs">
              GET {PIPELINE_API_URL}/pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {infoError && <p className="text-destructive">{infoError}</p>}
            {!info && !infoError && <p className="text-muted-foreground">Loading…</p>}
            {info && (
              <>
                <ol className="flex flex-wrap items-center gap-1.5">
                  {info.metadata.steps.map((s, i) => (
                    <li key={s.name} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-muted-foreground">→</span>}
                      <Badge variant="secondary" className="font-mono">{s.class}</Badge>
                    </li>
                  ))}
                </ol>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <dt className="text-muted-foreground">scikit-learn</dt>
                  <dd className="font-mono">{info.metadata.sklearn_version}</dd>
                  <dt className="text-muted-foreground">Built</dt>
                  <dd className="font-mono">{new Date(info.metadata.built_at).toLocaleString()}</dd>
                  <dt className="text-muted-foreground">CV accuracy</dt>
                  <dd className="font-mono">{(info.metadata.cv_accuracy_mean * 100).toFixed(1)}%</dd>
                  <dt className="text-muted-foreground">Test accuracy</dt>
                  <dd className="font-mono">
                    {(info.metadata.test_accuracy * 100).toFixed(1)}% (n={info.metadata.n_test})
                  </dd>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prediction</CardTitle>
          <CardDescription className="break-all font-mono text-xs">
            POST {PIPELINE_API_URL}/predict
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {error.status ? `${error.status} from the API` : "Request failed"}
                </p>
                <p className="text-muted-foreground">{error.message}</p>
              </div>
            </div>
          )}
          {!error && !result && (
            <p className="text-sm text-muted-foreground">
              Pick a preset or enter measurements and hit Classify.
            </p>
          )}
          {result && <PredictionView result={result} />}
        </CardContent>
      </Card>
    </div>
  );
}

function PredictionView({ result }: { result: Prediction }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold capitalize tracking-tight">{result.species}</span>
        <span className="text-sm text-muted-foreground">
          {(result.confidence * 100).toFixed(1)}% confidence
        </span>
      </div>

      <div className="space-y-2.5">
        {result.probabilities.map((p) => (
          <div key={p.species} className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 text-sm">
            <span className="capitalize">{p.species}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${p.probability * 100}%`, background: SPECIES_COLOR[p.species] }}
              />
            </div>
            <span className="text-right font-mono text-xs">{(p.probability * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div
        className={`flex gap-3 rounded-xl border p-4 text-sm ${
          result.is_unusual ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted/40"
        }`}
      >
        <Radar className={`mt-0.5 size-4.5 shrink-0 ${result.is_unusual ? "text-destructive" : "text-primary"}`} />
        <p>
          <span className="font-medium">
            {result.is_unusual ? "Unusual flower. " : "Typical flower. "}
          </span>
          <span className="text-muted-foreground">
            It sits {result.distance_to_centroid.toFixed(2)} units from the {result.species} centroid,
            farther than {result.typicality_percentile.toFixed(0)}% of training flowers of that species.
          </span>
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Features after the custom FlowerShapeFeatures step
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
          {Object.entries(result.engineered_features).map(([name, v]) => (
            <div key={name} className="rounded-lg bg-muted/40 px-2.5 py-1.5">
              <dt className="truncate text-muted-foreground">{name}</dt>
              <dd className="font-mono">{v.toFixed(3)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
