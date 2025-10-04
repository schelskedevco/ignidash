import pandas as pd
import os

# Input / output files
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

INPUT_CSV = os.path.join(project_root, 'src/lib/calc/data/ie-dividends-data.csv')
OUTPUT_TS = os.path.join(project_root, 'src/lib/calc/data/shiller-historical-yield-data.ts')

# Load CSV
df = pd.read_csv(INPUT_CSV)

# Drop rows without Date
df = df.dropna(subset=["Date"])

# Ensure Date is string and split
df["Date"] = df["Date"].astype(str)
df["Year"] = df["Date"].str.split(".").str[0].astype(int)
df["Month"] = df["Date"].str.split(".").str[1].fillna("0").astype(int)

# Force numeric types (some cells may be strings)
for col in ["S&P Comp. P", "Dividend D", "Long Interest Rate GS10"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Compute dividend yield = (12 * monthly dividend) / price
df["DividendYield"] = (df["Dividend D"] * 12) / df["S&P Comp. P"]

# Bond yield = GS10 / 100 (convert % to fraction)
df["BondYield"] = df["Long Interest Rate GS10"] / 100.0

# Take December values for each year
annual = df[df["Month"] == 12].copy()

# Filter to 1928+
annual = annual[annual["Year"] >= 1928]

# Select needed columns
annual = annual[["Year", "DividendYield", "BondYield"]]

# Write TypeScript
with open(OUTPUT_TS, "w") as f:
    f.write("export const shillerHistoricalData: ShillerHistoricalYearData[] = [\n")
    for _, row in annual.iterrows():
        f.write(
            f"  {{ year: {row['Year']}, stockYield: {row['DividendYield']:.4f}, bondYield: {row['BondYield']:.4f} }},\n"
        )
    f.write("];\n")

print(f"✅ Wrote {len(annual)} years of data to {OUTPUT_TS}")