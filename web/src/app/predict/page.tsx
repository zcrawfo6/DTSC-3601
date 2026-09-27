import type { Metadata } from "next";
import { Predictor } from "@/components/pipeline/predictor";

export const metadata: Metadata = {
  title: "Species Predictor · Iris Analytics",
};

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Live model</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Species predictor</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          A fitted scikit-learn pipeline (custom shape-feature transformer → standard scaler →
          logistic regression), served by FastAPI on Modal. Every result on this page comes from
          the live API. It also scores how typical the flower is by its distance from the
          predicted species&apos; centroid.
        </p>
      </header>
      <Predictor />
    </div>
  );
}
