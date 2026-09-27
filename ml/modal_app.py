"""Deploy the Iris species FastAPI service (serve.py) to Modal.

    cd ml
    uv run modal serve modal_app.py     # ephemeral, live-reloading
    uv run modal deploy modal_app.py    # persistent public URL

The image ships exactly three files next to each other in /root:
serve.py, pipeline_def.py, pipeline.joblib. scikit-learn is pinned to the
version recorded in the bundle's metadata so the pickle loads cleanly.
"""

from pathlib import Path

import modal

HERE = Path(__file__).parent
SKLEARN_VERSION = "1.9.1"  # must equal bundle["metadata"]["sklearn_version"]

if modal.is_local():
    import sys

    import joblib

    sys.path.insert(0, str(HERE))
    built_with = joblib.load(HERE / "pipeline.joblib")["metadata"]["sklearn_version"]
    if built_with != SKLEARN_VERSION:
        raise SystemExit(
            f"pipeline.joblib was built with scikit-learn {built_with}, "
            f"but the image pins {SKLEARN_VERSION}. Update SKLEARN_VERSION."
        )

image = (
    modal.Image.debian_slim(python_version="3.13")
    .uv_pip_install(f"scikit-learn=={SKLEARN_VERSION}", "joblib", "numpy", "fastapi[standard]")
    .add_local_file(HERE / "serve.py", "/root/serve.py")
    .add_local_file(HERE / "pipeline_def.py", "/root/pipeline_def.py")
    .add_local_file(HERE / "pipeline.joblib", "/root/pipeline.joblib")
)

app = modal.App("dtsc3601-iris-pipeline", image=image)


@app.function()
@modal.concurrent(max_inputs=20)
@modal.asgi_app()
def api():
    from serve import app as fastapi_app

    return fastapi_app
