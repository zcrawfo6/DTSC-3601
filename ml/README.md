# Iris species pipeline API

A fitted scikit-learn Pipeline served with FastAPI, deployed on Modal, and
called by the Vercel site's `/predict` page.

- **Live API:** https://zcrawfo6--dtsc3601-iris-pipeline-api.modal.run ([docs](https://zcrawfo6--dtsc3601-iris-pipeline-api.modal.run/docs))
- **Frontend:** https://web-ochre-alpha-20.vercel.app/predict

## Pipeline

`FlowerShapeFeatures` (custom, `pipeline_def.py`) → `StandardScaler` → `LogisticRegression`

The custom transformer adds sepal/petal length-to-width ratios, log petal area
and petal-to-sepal length. It learns a per-column floor at fit time so tiny
widths can't blow up a ratio at predict time.

`pipeline.joblib` is a dict bundle: the fitted `pipeline`, `target_names`,
per-class `centroids` + sorted `train_distances` (for the typicality score),
and `metadata` (`steps`, `built_at`, `sklearn_version`, accuracy).

## Endpoints

| Method | Path | |
|---|---|---|
| GET | `/health` | liveness + whether the artifact loaded |
| GET | `/pipeline` | describes the artifact (steps, built_at, sklearn_version, classes) |
| POST | `/predict` | species, probabilities, engineered features, typicality |

Bad input → 422 (Pydantic bounds, extra fields forbidden). Missing or
unloadable artifact → 503.

## Run it

```sh
uv run python ml/train.py                       # refit + write pipeline.joblib
cd ml && uv run uvicorn serve:app --reload      # http://localhost:8000/docs
uv run modal deploy modal_app.py                # ships serve.py, pipeline_def.py, pipeline.joblib
npx newman run postman/iris-pipeline.postman_collection.json
```

If you refit with a different scikit-learn, update `SKLEARN_VERSION` in
`modal_app.py`; deploy refuses to run if it doesn't match the bundle.
