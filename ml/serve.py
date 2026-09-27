"""FastAPI service for the fitted Iris species pipeline.

    cd ml && uv run uvicorn serve:app --reload    ->  http://localhost:8000/docs

The bundle is loaded once, at import. If pipeline.joblib is missing or can't
be unpickled, the app still starts and every artifact-backed route returns
503 instead of crashing with a 500.
"""

import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

import pipeline_def  # noqa: F401  (FlowerShapeFeatures must be importable for unpickling)

ARTIFACT_PATH = Path(os.environ.get("PIPELINE_PATH", Path(__file__).with_name("pipeline.joblib")))

BUNDLE: dict[str, Any] | None = None
LOAD_ERROR: str | None = None
try:
    BUNDLE = joblib.load(ARTIFACT_PATH)
except Exception as exc:  # missing file, bad pickle, version mismatch...
    LOAD_ERROR = f"{type(exc).__name__}: {exc}"

app = FastAPI(
    title="Iris Species Pipeline API",
    description="Fitted scikit-learn pipeline (custom shape features -> scaler -> logistic regression).",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def require_bundle() -> dict[str, Any]:
    if BUNDLE is None:
        raise HTTPException(status_code=503, detail=f"Pipeline artifact unavailable ({LOAD_ERROR})")
    return BUNDLE


class Flower(BaseModel):
    """Measurements in centimetres. Bounds are generous around the real
    Iris ranges (sepals 4.3-7.9 cm, petals 0.1-6.9 cm)."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={"example": {
            "sepal_length": 5.9, "sepal_width": 3.0, "petal_length": 4.2, "petal_width": 1.5,
        }},
    )

    sepal_length: float = Field(gt=0, le=15, description="cm")
    sepal_width: float = Field(gt=0, le=10, description="cm")
    petal_length: float = Field(gt=0, le=12, description="cm")
    petal_width: float = Field(gt=0, le=6, description="cm")


class SpeciesProbability(BaseModel):
    species: str
    probability: float


class Prediction(BaseModel):
    species: str
    confidence: float
    probabilities: list[SpeciesProbability]
    engineered_features: dict[str, float]
    distance_to_centroid: float
    typicality_percentile: float
    is_unusual: bool


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "artifact_loaded": BUNDLE is not None, "error": LOAD_ERROR}


@app.get("/pipeline")
def pipeline_info() -> dict[str, Any]:
    bundle = require_bundle()
    return {
        "artifact": ARTIFACT_PATH.name,
        "classes": bundle["target_names"],
        "input_features": bundle["input_features"],
        "engineered_features": bundle["engineered_features"],
        "metadata": bundle["metadata"],
    }


@app.post("/predict", response_model=Prediction)
def predict(flower: Flower) -> Prediction:
    bundle = require_bundle()
    pipeline = bundle["pipeline"]
    x = np.array([[getattr(flower, f) for f in bundle["input_features"]]])

    proba = pipeline.predict_proba(x)[0]
    best = int(np.argmax(proba))

    shaped = pipeline.named_steps["shape"].transform(x)[0]
    z = pipeline[:-1].transform(x)[0]
    distance = float(np.linalg.norm(z - bundle["centroids"][best]))
    train_distances = bundle["train_distances"]
    percentile = float(np.searchsorted(train_distances, distance) / len(train_distances) * 100)

    return Prediction(
        species=bundle["target_names"][best],
        confidence=round(float(proba[best]), 4),
        probabilities=[
            SpeciesProbability(species=name, probability=round(float(p), 4))
            for name, p in zip(bundle["target_names"], proba)
        ],
        engineered_features={
            name: round(float(v), 4) for name, v in zip(bundle["engineered_features"], shaped)
        },
        distance_to_centroid=round(distance, 4),
        typicality_percentile=round(percentile, 1),
        is_unusual=distance > bundle["metadata"]["typicality_p95_distance"],
    )
