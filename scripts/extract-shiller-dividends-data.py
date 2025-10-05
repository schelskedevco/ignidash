#!/usr/bin/env python3
"""
Extract historical stock dividend yield and bond yield data from Shiller's dataset.

This script processes Robert Shiller's publicly available data to extract:
- Stock dividend yield (S&P Composite)
- Bond yield (10-year Treasury GS10)

Data spans from 1928 to present with annual granularity (December values).
"""

import pandas as pd
import os

# Input / output files
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

INPUT_CSV = os.path.join(project_root, "src/lib/calc/data/ie-dividends-data.csv")
OUTPUT_TS = os.path.join(
    project_root, "src/lib/calc/data/shiller-historical-yield-data.ts"
)

# Load CSV
df = pd.read_csv(INPUT_CSV)

# Drop rows without Date
df = df.dropna(subset=["Date"])

# Parse Date into Year and Month
df["Date"] = df["Date"].astype(str)
df["year"] = df["Date"].str.split(".").str[0].astype(int)
df["month"] = df["Date"].str.split(".").str[1].fillna("0").astype(int)

# Force numeric types
for col in ["S&P Comp. P", "Dividend D", "Long Interest Rate GS10"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Calculate yields
df["stockYield"] = df["Dividend D"] / df["S&P Comp. P"]
df["bondYield"] = df["Long Interest Rate GS10"] / 100.0

# Take December values for each year, filter to 1928+
df = df[(df["month"] == 12) & (df["year"] >= 1928)]

# Select needed columns
df = df[["year", "stockYield", "bondYield"]]

# Write TypeScript
with open(OUTPUT_TS, "w") as f:
    f.write(
        """/**
 * Historical stock dividend yield and bond yield data (1928-present)
 *
 * Source: Robert Shiller's publicly available dataset
 * (http://www.econ.yale.edu/~shiller/data.htm)
 *
 * - stockYield: Annualized dividend yield of the S&P Composite index.
 *   Calculated as (12 x monthly dividend) / stock price, using December values.
 *
 * - bondYield: Yield of 10-year U.S. Treasury bonds (GS10), taken directly from Shiller.
 *   Values are given as fractions (e.g., 0.045 = 4.5%).
 *
 * Only December observations are included (one value per year).
 *
 * Generated automatically - do not edit manually.
 */

export interface ShillerHistoricalYearData {
  year: number;
  stockYield: number;
  bondYield: number;
}

export const shillerHistoricalData: ShillerHistoricalYearData[] = [
"""
    )

    for _, row in df.iterrows():
        f.write(
            f'  {{ year: {int(row["year"])}, stockYield: {row["stockYield"]:.4f}, '
            f'bondYield: {row["bondYield"]:.4f} }},\n'
        )

    f.write("];\n")

# Compute and display summary stats
stock_yields = df["stockYield"].values
bond_yields = df["bondYield"].values

print(f"✅ Parsed {len(df)} annual data points")
print(f"Data range: {int(df['year'].min())} - {int(df['year'].max())}")
print(f"Generated {OUTPUT_TS}")

print(f"\nSample Statistics:")
print(
    f"Stock Yield - Mean: {stock_yields.mean():.4f}, Std: {stock_yields.std(ddof=1):.4f}, "
    f"Min: {stock_yields.min():.4f}, Max: {stock_yields.max():.4f}"
)
print(
    f"Bond Yield  - Mean: {bond_yields.mean():.4f}, Std: {bond_yields.std(ddof=1):.4f}, "
    f"Min: {bond_yields.min():.4f}, Max: {bond_yields.max():.4f}"
)
