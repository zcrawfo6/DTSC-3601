"""
DTSC3601 — CSV EDA Explorer
A Streamlit app to load a CSV dataset, run initial exploratory data analysis,
and build interactive graphics.

Run with:
    uv run streamlit run app.py
"""

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

st.set_page_config(page_title="CSV EDA Explorer", page_icon="📊", layout="wide")


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
@st.cache_data
def load_csv(file) -> pd.DataFrame:
    return pd.read_csv(file)


@st.cache_data
def sample_dataset() -> pd.DataFrame:
    """A small built-in dataset so the app is usable before a CSV is uploaded."""
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


st.title("📊 CSV EDA Explorer")
st.caption("Upload a CSV, review an initial exploratory data analysis, then build your own charts.")

with st.sidebar:
    st.header("1. Load data")
    uploaded_file = st.file_uploader("Upload a CSV file", type=["csv"])
    use_sample = st.checkbox("Use sample dataset instead", value=uploaded_file is None)

if uploaded_file is not None and not use_sample:
    df = load_csv(uploaded_file)
    st.success(f"Loaded `{uploaded_file.name}` — {df.shape[0]:,} rows × {df.shape[1]} columns")
elif uploaded_file is not None and use_sample:
    df = sample_dataset()
    st.info("Showing sample dataset (uncheck the sidebar box to use your uploaded file).")
else:
    df = sample_dataset()
    st.info("No file uploaded yet — showing a sample dataset. Upload a CSV in the sidebar to explore your own data.")

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
