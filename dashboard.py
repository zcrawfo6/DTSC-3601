"""
DTSC3601 — Account Balances Dashboard
Combines ExpenseTracker.csv (money out) and Cashflow.csv (money in) into a
running account balance, overall and by payment method.

Run with:
    uv run streamlit run dashboard.py
"""

from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

st.set_page_config(page_title="Account Balances", page_icon="💰", layout="wide")

DATA_DIR = Path(__file__).parent / "data"
DEFAULT_EXPENSES = DATA_DIR / "ExpenseTracker.csv"
DEFAULT_CASHFLOW = DATA_DIR / "Cashflow.csv"


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
@st.cache_data
def load_transactions(expenses_source, cashflow_source) -> pd.DataFrame:
    expenses = pd.read_csv(expenses_source)
    cashflow = pd.read_csv(cashflow_source)

    expenses["Date"] = pd.to_datetime(expenses["Date"], errors="coerce")
    cashflow["Date"] = pd.to_datetime(cashflow["Date"], errors="coerce")
    expenses["Amount"] = pd.to_numeric(expenses["Amount"], errors="coerce")
    cashflow["Amount"] = pd.to_numeric(cashflow["Amount"], errors="coerce")

    expenses = expenses.dropna(subset=["Date", "PaymentMethod", "Amount"]).copy()
    cashflow = cashflow.dropna(subset=["Date", "PaymentMethod", "Amount"]).copy()

    expenses["Type"] = "Expense"
    expenses["SignedAmount"] = -expenses["Amount"].abs()
    if "Category" not in expenses.columns:
        expenses["Category"] = "Uncategorized"

    cashflow["Type"] = "Income"
    cashflow["SignedAmount"] = cashflow["Amount"].abs()
    cashflow["Category"] = "Income"

    keep = ["Date", "PaymentMethod", "Merchant", "Category", "Amount", "SignedAmount", "Type", "Notes"]
    for col in keep:
        if col not in expenses.columns:
            expenses[col] = pd.NA
        if col not in cashflow.columns:
            cashflow[col] = pd.NA

    txns = pd.concat([expenses[keep], cashflow[keep]], ignore_index=True)
    txns = txns.rename(columns={"PaymentMethod": "Account"})
    txns = txns.sort_values("Date").reset_index(drop=True)
    return txns


def with_running_balance(txns: pd.DataFrame, group_col: str | None = None) -> pd.DataFrame:
    """Add a cumulative Balance column, starting from $0, optionally per group."""
    df = txns.sort_values("Date").copy()
    if group_col:
        df["Balance"] = df.groupby(group_col)["SignedAmount"].cumsum()
    else:
        df["Balance"] = df["SignedAmount"].cumsum()
    return df


st.title("💰 Account Balances")
st.caption("Combined view of ExpenseTracker (money out) and Cashflow (money in), starting from a $0 baseline.")

with st.sidebar:
    st.header("Data")
    st.caption("Defaults to the bundled ExpenseTracker/Cashflow CSVs. Upload new exports to refresh.")
    expenses_file = st.file_uploader("ExpenseTracker CSV", type=["csv"])
    cashflow_file = st.file_uploader("Cashflow CSV", type=["csv"])

expenses_source = expenses_file if expenses_file is not None else DEFAULT_EXPENSES
cashflow_source = cashflow_file if cashflow_file is not None else DEFAULT_CASHFLOW

if not (expenses_file or DEFAULT_EXPENSES.exists()) or not (cashflow_file or DEFAULT_CASHFLOW.exists()):
    st.error("Missing ExpenseTracker/Cashflow data. Upload CSVs in the sidebar to continue.")
    st.stop()

txns = load_transactions(expenses_source, cashflow_source)

with st.sidebar:
    st.header("Filter")
    min_date, max_date = txns["Date"].min().date(), txns["Date"].max().date()
    date_range = st.date_input("Date range", value=(min_date, max_date), min_value=min_date, max_value=max_date)

if isinstance(date_range, tuple) and len(date_range) == 2:
    start, end = date_range
else:
    start, end = min_date, max_date

mask = (txns["Date"].dt.date >= start) & (txns["Date"].dt.date <= end)
period = txns.loc[mask].copy()

# ---------------------------------------------------------------------------
# KPIs
# ---------------------------------------------------------------------------
overall_all_time = with_running_balance(txns)
current_balance = overall_all_time["Balance"].iloc[-1] if not overall_all_time.empty else 0.0

total_income = period.loc[period["Type"] == "Income", "SignedAmount"].sum()
total_expenses = -period.loc[period["Type"] == "Expense", "SignedAmount"].sum()
net_change = total_income - total_expenses
savings_rate = (net_change / total_income * 100) if total_income > 0 else 0.0

c1, c2, c3, c4 = st.columns(4)
c1.metric("Current Balance", f"${current_balance:,.2f}")
c2.metric("Income (selected range)", f"${total_income:,.2f}")
c3.metric("Expenses (selected range)", f"${total_expenses:,.2f}")
c4.metric("Net Change", f"${net_change:,.2f}", delta=f"{savings_rate:.1f}% savings rate" if total_income else None)

st.divider()

# ---------------------------------------------------------------------------
# Overall balance over time
# ---------------------------------------------------------------------------
st.subheader("Balance over time")
overall = with_running_balance(period)
if overall.empty:
    st.info("No transactions in the selected date range.")
else:
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=overall["Date"],
            y=overall["Balance"],
            mode="lines+markers",
            line=dict(color="#00C46A", width=3),
            fill="tozeroy",
            fillcolor="rgba(0,196,106,0.12)",
            name="Balance",
        )
    )
    fig.update_layout(
        xaxis_title="Date",
        yaxis_title="Balance ($)",
        hovermode="x unified",
        margin=dict(l=10, r=10, t=10, b=10),
    )
    st.plotly_chart(fig, width='stretch')

# ---------------------------------------------------------------------------
# Balance by account (payment method)
# ---------------------------------------------------------------------------
st.subheader("Balance by account")

by_account = with_running_balance(period, group_col="Account")
snapshot = (
    by_account.sort_values("Date")
    .groupby("Account", as_index=False)
    .last()[["Account", "Balance"]]
    .sort_values("Balance", ascending=False)
)

col_bar, col_line = st.columns([1, 1.4])

with col_bar:
    st.markdown("**Current balance snapshot**")
    if snapshot.empty:
        st.info("No account activity in this range.")
    else:
        colors = ["#00C46A" if v >= 0 else "#FF4655" for v in snapshot["Balance"]]
        fig_bar = go.Figure(
            go.Bar(
                x=snapshot["Account"],
                y=snapshot["Balance"],
                marker_color=colors,
                text=[f"${v:,.2f}" for v in snapshot["Balance"]],
                textposition="outside",
            )
        )
        fig_bar.update_layout(
            yaxis_title="Balance ($)",
            margin=dict(l=10, r=10, t=10, b=10),
            showlegend=False,
        )
        st.plotly_chart(fig_bar, width='stretch')

with col_line:
    st.markdown("**Balance trend by account**")
    if by_account.empty:
        st.info("No account activity in this range.")
    else:
        fig_line = px.line(
            by_account,
            x="Date",
            y="Balance",
            color="Account",
            markers=True,
        )
        fig_line.update_layout(margin=dict(l=10, r=10, t=10, b=10), yaxis_title="Balance ($)")
        st.plotly_chart(fig_line, width='stretch')

st.divider()

# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------
with st.expander("Transaction detail"):
    display_cols = ["Date", "Account", "Type", "Category", "Merchant", "Amount", "Notes"]
    st.dataframe(
        period[display_cols].sort_values("Date", ascending=False),
        width='stretch',
        hide_index=True,
    )
