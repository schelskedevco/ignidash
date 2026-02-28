#!/usr/bin/env python3
"""
Compute correlation matrices from NYU returns + Shiller yields.

Reads:
  src/lib/calc/historical-data/nyu-returns.ts    (real returns + inflation)
  src/lib/calc/historical-data/shiller-yields.ts (stock/bond yields)

Merges by year, converts real returns to nominal, then prints correlation
matrices for nominal stock/bond/cash returns, inflation, and yields —
both for the full dataset (1928-present) and the most recent 35 years.

This is a diagnostic/analysis script, not part of the build.
"""

import re
import pandas as pd
import os


def parse_ts_data(filepath, pattern, columns):
    """Parse TypeScript data file and return DataFrame"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    matches = re.compile(pattern).findall(content)

    data = []
    for m in matches:
        row = {}
        for col, val in zip(columns, m):
            row[col] = int(val) if col == "year" else float(val)
        data.append(row)

    return pd.DataFrame(data)


# Input files
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

NYU_TS = os.path.join(project_root, "src/lib/calc/historical-data/nyu-returns.ts")
SHILLER_TS = os.path.join(project_root, "src/lib/calc/historical-data/shiller-yields.ts")

# Parse NYU data (real returns + inflation)
nyu_pattern = r"\{\s*year:\s*(\d+),\s*stockReturn:\s*([-\d.eE]+),\s*bondReturn:\s*([-\d.eE]+),\s*cashReturn:\s*([-\d.eE]+),\s*inflationRate:\s*([-\d.eE]+)\s*\}"
nyu_columns = ["year", "stockReturn", "bondReturn", "cashReturn", "inflationRate"]
nyu_df = parse_ts_data(NYU_TS, nyu_pattern, nyu_columns)

# Parse Shiller data (yields)
shiller_pattern = (
    r"\{\s*year:\s*(\d+),\s*stockYield:\s*([-\d.eE]+),\s*bondYield:\s*([-\d.eE]+)\s*\}"
)
shiller_columns = ["year", "stockYield", "bondYield"]
shiller_df = parse_ts_data(SHILLER_TS, shiller_pattern, shiller_columns)

# Merge datasets by year
df = pd.merge(nyu_df, shiller_df, on="year", how="inner")

# Convert real returns to nominal returns
for col in ["stockReturn", "bondReturn", "cashReturn"]:
    df[f"{col}_nominal"] = (1 + df[col]) * (1 + df["inflationRate"]) - 1

print("Merged Data Sample:")
print(df.head())
print("\n...")
print(df.tail())
print("\n")

# Define columns for correlation analysis
cols = [
    "stockReturn_nominal",
    "bondReturn_nominal",
    "cashReturn_nominal",
    "inflationRate",
    "bondYield",
    "stockYield",
]

# Correlation Matrix: Full Dataset
corr_full = df[cols].corr()
print(f"Correlation Matrix ({int(df['year'].min())}-{int(df['year'].max())}):")
print(corr_full.round(2))
print("\n")

# Correlation Matrix: Last 35 Years
max_year = int(df["year"].max())
df_recent = df[df["year"] >= max_year - 34]
corr_recent = df_recent[cols].corr()
print(f"Correlation Matrix (Last 35 Years, {max_year-34}-{max_year}):")
print(corr_recent.round(2))
