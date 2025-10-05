#!/usr/bin/env python3
"""
Extract NYU historical financial data from nyu-historical-data.csv and generate TypeScript file.

This script processes the NYU Stern historical data to create annual returns for:
- Real stock returns (S&P 500 with dividends)
- Real bond returns (10-year T.Bonds)
- Real cash returns (3-month T.Bills)
- Inflation rates

Data spans from 1928 to present with annual granularity.
"""

import pandas as pd
import os

# Input / output files
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

INPUT_CSV = os.path.join(project_root, "src/lib/calc/data/nyu-historical-data.csv")
OUTPUT_TS = os.path.join(project_root, "src/lib/calc/data/nyu-historical-data.ts")

# Load CSV
df = pd.read_csv(INPUT_CSV)

# Drop rows without year
df = df.dropna(subset=[df.columns[0]])

# Parse columns (assuming: Year, Inflation, Stock, ?, Cash, Bond)
df.columns = df.columns.str.strip()
df["year"] = df.iloc[:, 0].astype(int)

# Convert percentage strings to decimals
for i, col_name in [
    (1, "inflationRate"),
    (2, "stockReturn"),
    (4, "cashReturn"),
    (5, "bondReturn"),
]:
    df[col_name] = df.iloc[:, i].str.rstrip("%").astype(float) / 100.0

# Select needed columns
df = df[["year", "stockReturn", "bondReturn", "cashReturn", "inflationRate"]]

# Write TypeScript
with open(OUTPUT_TS, "w") as f:
    f.write(
        """/**
 * NYU Stern historical financial market data (1928-present)
 * 
 * Real annual returns for stocks, bonds, cash, plus inflation rates.
 * Data source: NYU Stern School of Business historical dataset
 * 
 * Generated automatically - do not edit manually.
 */

export interface NyuHistoricalYearData {
  year: number;
  stockReturn: number;    // Real annual stock return (S&P 500 with dividends)
  bondReturn: number;     // Real annual bond return (10-year T.Bonds)
  cashReturn: number;     // Real annual cash return (3-month T.Bills)
  inflationRate: number;  // Annual inflation rate
}

export const nyuHistoricalData: NyuHistoricalYearData[] = [
"""
    )

    for _, row in df.iterrows():
        f.write(
            f'  {{ year: {int(row["year"])}, stockReturn: {row["stockReturn"]:.6f}, '
            f'bondReturn: {row["bondReturn"]:.6f}, cashReturn: {row["cashReturn"]:.6f}, '
            f'inflationRate: {row["inflationRate"]:.6f} }},\n'
        )

    f.write(
        """];

/**
 * Get NYU historical data for a specific year range
 */
export function getNyuHistoricalData(startYear: number, endYear: number): NyuHistoricalYearData[] {
  return nyuHistoricalData.filter(data => data.year >= startYear && data.year <= endYear);
}

/**
 * Get the full date range of available NYU historical data
 */
export function getNyuDataRange(): { startYear: number; endYear: number } {
  return {
    startYear: nyuHistoricalData[0].year,
    endYear: nyuHistoricalData[nyuHistoricalData.length - 1].year,
  };
}

/**
 * Calculate statistics for NYU historical returns
 */
export function calculateNyuHistoricalStats(data: NyuHistoricalYearData[]) {
  if (data.length === 0) return null;
  
  const stockReturns = data.map(d => d.stockReturn);
  const bondReturns = data.map(d => d.bondReturn);
  const cashReturns = data.map(d => d.cashReturn);
  const inflationRates = data.map(d => d.inflationRate);
  
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = (arr: number[]) => {
    const m = mean(arr);
    return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  };
  const stdDev = (arr: number[]) => Math.sqrt(variance(arr));
  
  return {
    stocks: {
      mean: mean(stockReturns),
      stdDev: stdDev(stockReturns),
      min: Math.min(...stockReturns),
      max: Math.max(...stockReturns)
    },
    bonds: {
      mean: mean(bondReturns),
      stdDev: stdDev(bondReturns),
      min: Math.min(...bondReturns),
      max: Math.max(...bondReturns)
    },
    cash: {
      mean: mean(cashReturns),
      stdDev: stdDev(cashReturns),
      min: Math.min(...cashReturns),
      max: Math.max(...cashReturns)
    },
    inflation: {
      mean: mean(inflationRates),
      stdDev: stdDev(inflationRates),
      min: Math.min(...inflationRates),
      max: Math.max(...inflationRates)
    }
  };
}
"""
    )

# Compute and display summary stats
stock_returns = df["stockReturn"].values
bond_returns = df["bondReturn"].values
cash_returns = df["cashReturn"].values
inflation_rates = df["inflationRate"].values

# Nominal returns
stock_nominal = (1 + stock_returns) * (1 + inflation_rates) - 1
bond_nominal = (1 + bond_returns) * (1 + inflation_rates) - 1
cash_nominal = (1 + cash_returns) * (1 + inflation_rates) - 1

print(f"✅ Parsed {len(df)} annual data points")
print(f"Data range: {int(df['year'].min())} - {int(df['year'].max())}")
print(f"Generated {OUTPUT_TS}")

print(f"\nSample Statistics (Real):")
print(
    f"Stocks - Mean: {stock_returns.mean():6.2%}, Std: {stock_returns.std(ddof=1):6.2%}"
)
print(
    f"Bonds  - Mean: {bond_returns.mean():6.2%}, Std: {bond_returns.std(ddof=1):6.2%}"
)
print(
    f"Cash   - Mean: {cash_returns.mean():6.2%}, Std: {cash_returns.std(ddof=1):6.2%}"
)
print(
    f"Infl   - Mean: {inflation_rates.mean():6.2%}, Std: {inflation_rates.std(ddof=1):6.2%}"
)

print(f"\nSample Statistics (Nominal):")
print(
    f"Stocks - Mean: {stock_nominal.mean():6.2%}, Std: {stock_nominal.std(ddof=1):6.2%}"
)
print(
    f"Bonds  - Mean: {bond_nominal.mean():6.2%}, Std: {bond_nominal.std(ddof=1):6.2%}"
)
print(
    f"Cash   - Mean: {cash_nominal.mean():6.2%}, Std: {cash_nominal.std(ddof=1):6.2%}"
)
