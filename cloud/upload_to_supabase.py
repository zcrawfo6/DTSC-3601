"""
DTSC3601 -- upload the CSV EDA Explorer's sample dataset to Supabase.

Generates the same synthetic dataset app.py falls back to when no CSV is
uploaded (sepal/petal measurements for setosa/versicolor/virginica, seeded
for reproducibility), then loads it into the `eda_samples` table.

Prereqs:
    1. Run cloud/schema.sql in the Supabase SQL editor first.
    2. Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
       (Project Settings -> Data API. Use the service_role key here, not the
       anon/publishable key -- only service_role can write past RLS.)

Run with:
    uv run python cloud/upload_to_supabase.py
"""

import os

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


def sample_dataset() -> pd.DataFrame:
    """Same generator as app.py's sample_dataset() -- kept in sync deliberately."""
    rng = np.random.default_rng(42)
    n = 200
    species = rng.choice(["setosa", "versicolor", "virginica"], size=n)
    return pd.DataFrame(
        {
            "sepal_length": rng.normal(5.8, 0.8, n).round(2),
            "sepal_width": rng.normal(3.0, 0.4, n).round(2),
            "petal_length": rng.normal(3.8, 1.7, n).round(2),
            "petal_width": rng.normal(1.2, 0.7, n).round(2),
            "species": species,
        }
    )


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key or "your-project" in url:
        raise SystemExit(
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first "
            "(Supabase project -> Project Settings -> Data API)."
        )

    supabase: Client = create_client(url, key)

    df = sample_dataset()
    records = df.to_dict(orient="records")

    # Table has no natural unique key here, so start clean each run instead of
    # upserting -- avoids piling up duplicate rows if this script is re-run.
    supabase.table("eda_samples").delete().gte("id", 0).execute()
    result = supabase.table("eda_samples").insert(records).execute()
    print(f"Inserted {len(result.data)} rows into eda_samples.")


if __name__ == "__main__":
    main()
