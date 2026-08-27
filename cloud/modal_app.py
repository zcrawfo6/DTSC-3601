"""
DTSC3601 -- Modal app that serves the Supabase `eda_samples` table over HTTP.

The Streamlit dashboard (cloud_dashboard.py) calls this endpoint instead of
generating/uploading a CSV directly, so the data path is:

    Supabase (Postgres) -> Modal (web endpoint) -> Streamlit (dashboard)

Setup (one-time):
    modal setup                                   # links this machine to your Modal account
    modal secret create supabase-secrets \\
        SUPABASE_URL=<your project url> \\
        SUPABASE_ANON_KEY=<your anon/publishable key>

    (Project Settings -> Data API in Supabase for both values. The anon key is
    safe to use here because the `eda_samples` table only grants it read
    access via the "Public read access" RLS policy in schema.sql.)

Run locally (ephemeral, live-reloading):
    modal serve cloud/modal_app.py

Deploy (persistent public URL):
    modal deploy cloud/modal_app.py
"""

import modal

image = modal.Image.debian_slim(python_version="3.13").pip_install("supabase", "fastapi[standard]")
app = modal.App("dtsc3601-eda-samples", image=image)

secrets = [modal.Secret.from_name("supabase-secrets")]


@app.function(secrets=secrets)
@modal.fastapi_endpoint(method="GET")
def samples() -> list[dict]:
    """Return every row of the eda_samples table as JSON."""
    import os

    from supabase import create_client

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_ANON_KEY"],
    )
    response = supabase.table("eda_samples").select("*").order("id").execute()
    return response.data


@app.function(secrets=secrets)
@modal.fastapi_endpoint(method="GET")
def health() -> dict:
    """Quick check that the Supabase connection works."""
    import os

    from supabase import create_client

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_ANON_KEY"],
    )
    response = supabase.table("eda_samples").select("id", count="exact").execute()
    return {"status": "ok", "row_count": response.count}
