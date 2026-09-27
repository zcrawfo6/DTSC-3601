"""Fit the Iris species pipeline and dump it as a bundle to pipeline.joblib.

    uv run python ml/train.py

The bundle is a dict: the fitted pipeline, the class names, the per-class
centroids + training distances the API uses for its "how typical is this
flower" score, and metadata (steps, built_at, sklearn_version).
"""

from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from pipeline_def import INPUT_FEATURES, FlowerShapeFeatures

OUT = Path(__file__).with_name("pipeline.joblib")
SEED = 3601


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("shape", FlowerShapeFeatures(floor_fraction=0.5)),
        ("scale", StandardScaler()),
        ("clf", LogisticRegression(C=1.0, max_iter=1000)),
    ])


def main() -> None:
    iris = load_iris()
    X, y = iris.data, iris.target
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=SEED
    )

    cv_scores = cross_val_score(build_pipeline(), X_train, y_train, cv=5)
    pipeline = build_pipeline().fit(X_train, y_train)
    test_accuracy = float(pipeline.score(X_test, y_test))

    # Typicality: distance from each training flower to its own class centroid
    # in the pipeline's scaled feature space. The API reports where a new
    # flower's distance falls in that distribution.
    Z = pipeline[:-1].transform(X_train)
    centroids = np.vstack([Z[y_train == k].mean(axis=0) for k in range(len(iris.target_names))])
    train_distances = np.sort(np.linalg.norm(Z - centroids[y_train], axis=1))

    bundle = {
        "pipeline": pipeline,
        "target_names": [str(n) for n in iris.target_names],
        "input_features": INPUT_FEATURES,
        "engineered_features": [str(f) for f in pipeline[:-1].get_feature_names_out()],
        "centroids": centroids,
        "train_distances": train_distances,
        "metadata": {
            "steps": [
                {"name": name, "class": type(step).__name__, "params": {
                    k: v for k, v in step.get_params(deep=False).items()
                    if isinstance(v, (int, float, str, bool, type(None)))
                }}
                for name, step in pipeline.steps
            ],
            "built_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "sklearn_version": sklearn.__version__,
            "dataset": "sklearn.datasets.load_iris (150 flowers, 3 species)",
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
            "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
            "test_accuracy": round(test_accuracy, 4),
            "typicality_p95_distance": round(float(np.percentile(train_distances, 95)), 4),
        },
    }
    joblib.dump(bundle, OUT)
    print(f"wrote {OUT}")
    print(f"cv accuracy {cv_scores.mean():.3f}, test accuracy {test_accuracy:.3f}")


if __name__ == "__main__":
    main()
