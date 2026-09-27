// Client for the fitted scikit-learn pipeline served by FastAPI on Modal
// (see ml/serve.py and ml/modal_app.py). Called straight from the browser;
// the API allows any origin via CORS.

export const PIPELINE_API_URL = (
  process.env.NEXT_PUBLIC_PIPELINE_API_URL ??
  "https://zcrawfo6--dtsc3601-iris-pipeline-api.modal.run"
).replace(/\/$/, "");

export const MEASUREMENTS = [
  { key: "sepal_length", label: "Sepal length", max: 15 },
  { key: "sepal_width", label: "Sepal width", max: 10 },
  { key: "petal_length", label: "Petal length", max: 12 },
  { key: "petal_width", label: "Petal width", max: 6 },
] as const;

export type MeasurementKey = (typeof MEASUREMENTS)[number]["key"];
export type Flower = Record<MeasurementKey, number>;

export type Prediction = {
  species: string;
  confidence: number;
  probabilities: { species: string; probability: number }[];
  engineered_features: Record<string, number>;
  distance_to_centroid: number;
  typicality_percentile: number;
  is_unusual: boolean;
};

export type PipelineInfo = {
  artifact: string;
  classes: string[];
  input_features: string[];
  engineered_features: string[];
  metadata: {
    steps: { name: string; class: string; params: Record<string, unknown> }[];
    built_at: string;
    sklearn_version: string;
    dataset: string;
    n_train: number;
    n_test: number;
    cv_accuracy_mean: number;
    test_accuracy: number;
    typicality_p95_distance: number;
  };
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PIPELINE_API_URL}${path}`, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (res.status === 422 && Array.isArray(body?.detail)) {
      message = body.detail
        .map((d: { loc: string[]; msg: string }) => `${d.loc.at(-1)}: ${d.msg}`)
        .join("; ");
    } else if (typeof body?.detail === "string") {
      message = body.detail;
    }
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export const getPipelineInfo = () => request<PipelineInfo>("/pipeline");

export const predict = (flower: Flower) =>
  request<Prediction>("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flower),
  });
