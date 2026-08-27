"""
DTSC3601 -- CSV EDA Explorer (cloud-backed)

Same EDA explorer as app.py, but the data now comes from Supabase via a
Modal web endpoint instead of a local upload:

    Supabase (Postgres) -> Modal (cloud/modal_app.py) -> this Streamlit app

Set MODAL_SAMPLES_URL in .env to the deployed endpoint, e.g.
    https://<your-workspace>--dtsc3601-eda-samples-samples.modal.run

Run with:
    uv run streamlit run cloud_dashboard.py
"""

import os

import numpy as np
import pandas as pd
import plotly.express as px
import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="CSV EDA Explorer (Cloud)", page_icon="☁️", layout="wide")


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
@st.cache_data(ttl=60)
def load_samples(endpoint_url: str) -> pd.DataFrame:
    response = requests.get(endpoint_url, timeout=15)
    response.raise_for_status()
    df = pd.DataFrame(response.json())
    return df.drop(columns=["id"], errors="ignore")


st.title("☁️ CSV EDA Explorer -- Cloud")
st.caption("Data path: Supabase (Postgres) → Modal (web endpoint) → Streamlit.")

with st.sidebar:
    st.header("Data source")
    # Local dev: set MODAL_SAMPLES_URL in .env.
    # Streamlit Community Cloud: set it under the app's Secrets (root-level
    # TOML keys are exposed as both st.secrets and os.environ there).
    default_url = os.environ.get("MODAL_SAMPLES_URL") or st.secrets.get("MODAL_SAMPLES_URL", "")
    endpoint_url = st.text_input("Modal endpoint URL", value=default_url)
    if st.button("Refresh data"):
        st.cache_data.clear()

if not endpoint_url:
    st.error("Set MODAL_SAMPLES_URL in .env, or paste the endpoint URL in the sidebar, to continue.")
    st.stop()

try:
    df = load_samples(endpoint_url)
except requests.RequestException as error:
    st.error(f"Couldn't reach the Modal endpoint: {error}")
    st.stop()

if df.empty:
    st.warning("No rows came back from Supabase yet — run cloud/upload_to_supabase.py first.")
    st.stop()

st.success(f"Loaded `eda_samples` from Supabase — {df.shape[0]:,} rows × {df.shape[1]} columns")

numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
categorical_cols = df.select_dtypes(exclude=np.number).columns.tolist()

# ---------------------------------------------------------------------------
# Initial EDA
# ---------------------------------------------------------------------------
st.header("Initial exploratory data analysis")

tab_overview, tab_stats, tab_missing = st.tabs(["Overview", "Summary statistics", "Missing values"])

with tab_overview:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Rows", f"{df.shape[0]:,}")
    c2.metric("Columns", df.shape[1])
    c3.metric("Numeric columns", len(numeric_cols))
    c4.metric("Categorical columns", len(categorical_cols))

    st.subheader("Preview")
    n_rows = st.slider("Rows to preview", 5, min(100, max(5, len(df))), min(10, len(df)))
    st.dataframe(df.head(n_rows), use_container_width=True)

    st.subheader("Column types")
    dtype_df = pd.DataFrame({"column": df.columns, "dtype": df.dtypes.astype(str).values})
    st.dataframe(dtype_df, use_container_width=True, hide_index=True)

with tab_stats:
    if numeric_cols:
        st.subheader("Numeric summary")
        st.dataframe(df[numeric_cols].describe().T, use_container_width=True)
    else:
        st.warning("No numeric columns found.")

    if categorical_cols:
        st.subheader("Categorical summary")
        cat_col = st.selectbox("Column", categorical_cols, key="cat_summary_col")
        counts = df[cat_col].value_counts(dropna=False).rename_axis(cat_col).reset_index(name="count")
        st.dataframe(counts, use_container_width=True, hide_index=True)

with tab_missing:
    missing = df.isna().sum()
    missing_pct = (missing / len(df) * 100).round(2)
    missing_df = pd.DataFrame(
        {"column": df.columns, "missing_count": missing.values, "missing_pct": missing_pct.values}
    ).sort_values("missing_count", ascending=False)

    total_missing = int(missing.sum())
    if total_missing == 0:
        st.success("No missing values detected.")
    else:
        st.warning(f"{total_missing:,} missing values across the dataset.")
    st.dataframe(missing_df, use_container_width=True, hide_index=True)

    if total_missing > 0:
        fig = px.bar(missing_df[missing_df.missing_count > 0], x="column", y="missing_count", title="Missing values by column")
        st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------------------------
# Graphics builder
# ---------------------------------------------------------------------------
st.header("Build your own graphics")

chart_type = st.selectbox(
    "Chart type",
    ["Histogram", "Scatter plot", "Box plot", "Bar chart", "Correlation heatmap", "Line chart"],
)

if chart_type == "Histogram":
    col = st.selectbox("Column", numeric_cols)
    color = st.selectbox("Color by (optional)", [None] + categorical_cols)
    bins = st.slider("Bins", 5, 100, 30)
    fig = px.histogram(df, x=col, color=color, nbins=bins, title=f"Distribution of {col}")
    st.plotly_chart(fig, use_container_width=True)

elif chart_type == "Scatter plot":
    x = st.selectbox("X axis", numeric_cols, index=0)
    y = st.selectbox("Y axis", numeric_cols, index=min(1, len(numeric_cols) - 1))
    color = st.selectbox("Color by (optional)", [None] + categorical_cols + numeric_cols)
    fig = px.scatter(df, x=x, y=y, color=color, title=f"{y} vs {x}")
    st.plotly_chart(fig, use_container_width=True)

elif chart_type == "Box plot":
    y = st.selectbox("Numeric column", numeric_cols)
    x = st.selectbox("Group by (optional)", [None] + categorical_cols)
    fig = px.box(df, x=x, y=y, title=f"Box plot of {y}" + (f" by {x}" if x else ""))
    st.plotly_chart(fig, use_container_width=True)

elif chart_type == "Bar chart":
    if categorical_cols:
        cat = st.selectbox("Category column", categorical_cols)
        agg_col = st.selectbox("Value to aggregate (optional — leave for counts)", [None] + numeric_cols)
        if agg_col:
            agg_func = st.selectbox("Aggregation", ["mean", "sum", "median", "max", "min"])
            plot_df = df.groupby(cat, dropna=False)[agg_col].agg(agg_func).reset_index()
            fig = px.bar(plot_df, x=cat, y=agg_col, title=f"{agg_func.title()} of {agg_col} by {cat}")
        else:
            plot_df = df[cat].value_counts(dropna=False).rename_axis(cat).reset_index(name="count")
            fig = px.bar(plot_df, x=cat, y="count", title=f"Counts of {cat}")
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("No categorical columns available for a bar chart.")

elif chart_type == "Correlation heatmap":
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr(numeric_only=True)
        fig = px.imshow(corr, text_auto=".2f", color_continuous_scale="RdBu_r", zmin=-1, zmax=1, title="Correlation heatmap")
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("Need at least two numeric columns for a correlation heatmap.")

elif chart_type == "Line chart":
    x = st.selectbox("X axis", df.columns.tolist())
    y = st.selectbox("Y axis", numeric_cols)
    color = st.selectbox("Color by (optional)", [None] + categorical_cols)
    fig = px.line(df.sort_values(x), x=x, y=y, color=color, title=f"{y} over {x}")
    st.plotly_chart(fig, use_container_width=True)

with st.expander("Raw data"):
    st.dataframe(df, use_container_width=True)
