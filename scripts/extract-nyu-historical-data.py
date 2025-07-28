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

import csv
import re
from typing import List, Tuple, Dict
from dataclasses import dataclass
from decimal import Decimal, getcontext

# Set high precision for financial calculations
getcontext().prec = 28

@dataclass
class NyuAnnualData:
    """Annual financial data from NYU Stern dataset"""
    year: int
    inflation_rate: Decimal
    stock_return: Decimal
    cash_return: Decimal
    bond_return: Decimal

def parse_percentage(pct_str: str) -> Decimal:
    """Convert percentage string (e.g., '45.49%') to decimal (e.g., 0.4549)"""
    # Remove % sign and convert to decimal, then divide by 100
    clean_str = pct_str.strip().rstrip('%')
    return Decimal(clean_str) / Decimal('100')

def parse_csv_file(filepath: str) -> List[NyuAnnualData]:
    """Parse the NYU CSV file and return annual data points"""
    annual_data = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # Skip header
        next(reader)
        
        for row in reader:
            if len(row) < 6 or not row[0].strip():
                continue
                
            try:
                # Parse year
                year = int(row[0].strip())
                
                # Parse percentage columns and convert to decimals
                inflation_rate = parse_percentage(row[1])  # Column 1: Inflation Rate
                stock_return = parse_percentage(row[2])    # Column 2: S&P 500 (includes dividends)
                cash_return = parse_percentage(row[4])     # Column 4: 3-month T. Bill (Real)
                bond_return = parse_percentage(row[5])     # Column 5: 10-year T.Bonds
                
                annual_data.append(NyuAnnualData(
                    year=year,
                    inflation_rate=inflation_rate,
                    stock_return=stock_return,
                    cash_return=cash_return,
                    bond_return=bond_return
                ))
                
            except (ValueError, IndexError) as e:
                print(f"Skipping row due to parsing error: {row} - {e}")
                continue
    
    return annual_data

def generate_typescript_file(annual_data: List[NyuAnnualData], output_path: str):
    """Generate TypeScript file with NYU historical data"""
    
    # Sort by year
    annual_data.sort(key=lambda x: x.year)
    
    ts_content = '''/**
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
'''
    
    # Add data points
    for data in annual_data:
        stock_return = float(data.stock_return)
        bond_return = float(data.bond_return)
        cash_return = float(data.cash_return)
        inflation_rate = float(data.inflation_rate)
        
        ts_content += f'  {{ year: {data.year}, stockReturn: {stock_return:.6f}, bondReturn: {bond_return:.6f}, cashReturn: {cash_return:.6f}, inflationRate: {inflation_rate:.6f} }},\n'
    
    ts_content += '''];

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
    startYear: nyuHistoricalData[0]?.year ?? 1928,
    endYear: nyuHistoricalData[nyuHistoricalData.length - 1]?.year ?? new Date().getFullYear()
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
'''
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

def main():
    """Main execution function"""
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    csv_path = os.path.join(project_root, 'src/lib/calc/data/nyu-historical-data.csv')
    output_path = os.path.join(project_root, 'src/lib/calc/data/nyu-historical-data.ts')
    
    print("Parsing NYU CSV data...")
    annual_data = parse_csv_file(csv_path)
    print(f"Parsed {len(annual_data)} annual data points")
    
    if annual_data:
        print(f"Data range: {annual_data[0].year} - {annual_data[-1].year}")
        
        print("Generating TypeScript file...")
        generate_typescript_file(annual_data, output_path)
        print(f"Generated {output_path}")
        
        # Print sample statistics
        if len(annual_data) > 0:
            stock_returns = [float(d.stock_return) for d in annual_data]
            bond_returns = [float(d.bond_return) for d in annual_data]
            cash_returns = [float(d.cash_return) for d in annual_data]
            inflation_rates = [float(d.inflation_rate) for d in annual_data]
            
            print(f"\nSample Statistics:")
            print(f"Stocks - Mean: {sum(stock_returns)/len(stock_returns):6.2%}, Std: {(sum([(x-sum(stock_returns)/len(stock_returns))**2 for x in stock_returns])/len(stock_returns))**0.5:6.2%}")
            print(f"Bonds  - Mean: {sum(bond_returns)/len(bond_returns):6.2%}, Std: {(sum([(x-sum(bond_returns)/len(bond_returns))**2 for x in bond_returns])/len(bond_returns))**0.5:6.2%}")
            print(f"Cash   - Mean: {sum(cash_returns)/len(cash_returns):6.2%}, Std: {(sum([(x-sum(cash_returns)/len(cash_returns))**2 for x in cash_returns])/len(cash_returns))**0.5:6.2%}")
            print(f"Infl   - Mean: {sum(inflation_rates)/len(inflation_rates):6.2%}, Std: {(sum([(x-sum(inflation_rates)/len(inflation_rates))**2 for x in inflation_rates])/len(inflation_rates))**0.5:6.2%}")
    else:
        print("No annual data generated!")

if __name__ == "__main__":
    main()