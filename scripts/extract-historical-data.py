#!/usr/bin/env python3
"""
Extract historical financial data from ie-data.csv and generate TypeScript file.

This script processes the Ibbotson-Shiller data to create annual returns for:
- Real stock returns (S&P 500)
- Real bond returns 
- Inflation rates

Data spans from 1871 to present with monthly granularity, converted to annual.
"""

import csv
import re
from typing import List, Tuple, Dict
from dataclasses import dataclass
from decimal import Decimal, getcontext

# Set high precision for financial calculations
getcontext().prec = 28

@dataclass
class MonthlyData:
    """Monthly financial data point"""
    year: int
    month: int
    stock_price: Decimal
    bond_return: Decimal
    cpi: Decimal

@dataclass 
class AnnualData:
    """Annual financial returns"""
    year: int
    stock_return: Decimal
    bond_return: Decimal
    inflation_rate: Decimal

def parse_csv_file(filepath: str) -> List[MonthlyData]:
    """Parse the CSV file and return monthly data points"""
    monthly_data = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # Skip header
        next(reader)
        
        for row in reader:
            if len(row) < 4 or not row[0].strip():
                continue
                
            try:
                # Parse date (format: YYYY.MM)
                date_str = row[0].strip()
                year, month = map(int, date_str.split('.'))
                
                # Parse stock price (remove commas and quotes)
                stock_price_str = row[1].strip().replace('"', '').replace(',', '')
                stock_price = Decimal(stock_price_str)
                
                # Parse bond return
                bond_return = Decimal(row[2].strip())
                
                # Parse CPI
                cpi = Decimal(row[3].strip())
                
                monthly_data.append(MonthlyData(
                    year=year,
                    month=month,
                    stock_price=stock_price,
                    bond_return=bond_return,
                    cpi=cpi
                ))
                
            except (ValueError, IndexError) as e:
                print(f"Skipping row due to parsing error: {row} - {e}")
                continue
    
    return monthly_data

def calculate_annual_returns(monthly_data: List[MonthlyData]) -> List[AnnualData]:
    """Convert monthly data to annual returns"""
    annual_data = []
    
    # Group by year
    years = {}
    for data in monthly_data:
        if data.year not in years:
            years[data.year] = []
        years[data.year].append(data)
    
    for year in sorted(years.keys()):
        year_data = sorted(years[year], key=lambda x: x.month)
        
        # Skip if we don't have complete year (12 months)
        if len(year_data) != 12:
            continue
            
        # Calculate stock return (price appreciation + any dividends embedded in total return index)
        start_price = year_data[0].stock_price
        end_price = year_data[-1].stock_price
        stock_return = (end_price / start_price) - Decimal('1')
        
        # Calculate bond return (from index levels, similar to stocks)
        start_bond_index = year_data[0].bond_return
        end_bond_index = year_data[-1].bond_return
        bond_return = (end_bond_index / start_bond_index) - Decimal('1')
        
        # Calculate inflation rate
        start_cpi = year_data[0].cpi
        end_cpi = year_data[-1].cpi
        inflation_rate = (end_cpi / start_cpi) - Decimal('1')
        
        annual_data.append(AnnualData(
            year=year,
            stock_return=stock_return,
            bond_return=bond_return,
            inflation_rate=inflation_rate
        ))
    
    return annual_data

def generate_typescript_file(annual_data: List[AnnualData], output_path: str):
    """Generate TypeScript file with historical data"""
    
    # Sort by year
    annual_data.sort(key=lambda x: x.year)
    
    ts_content = '''/**
 * Historical financial market data (1871-present)
 * 
 * Real annual returns for stocks and bonds, plus inflation rates.
 * Data source: Ibbotson-Shiller dataset via ie-data.csv
 * 
 * Generated automatically - do not edit manually.
 */

export interface HistoricalYearData {
  year: number;
  stockReturn: number;    // Real annual stock return (S&P 500 total return)
  bondReturn: number;     // Real annual bond return
  inflationRate: number;  // Annual inflation rate (CPI-based)
}

export const historicalData: HistoricalYearData[] = [
'''
    
    # Add data points
    for data in annual_data:
        stock_return = float(data.stock_return)
        bond_return = float(data.bond_return) 
        inflation_rate = float(data.inflation_rate)
        
        ts_content += f'  {{ year: {data.year}, stockReturn: {stock_return:.6f}, bondReturn: {bond_return:.6f}, inflationRate: {inflation_rate:.6f} }},\n'
    
    ts_content += '''];

/**
 * Get historical data for a specific year range
 */
export function getHistoricalData(startYear: number, endYear: number): HistoricalYearData[] {
  return historicalData.filter(data => data.year >= startYear && data.year <= endYear);
}

/**
 * Get the full date range of available historical data
 */
export function getDataRange(): { startYear: number; endYear: number } {
  return {
    startYear: historicalData[0]?.year ?? 1871,
    endYear: historicalData[historicalData.length - 1]?.year ?? new Date().getFullYear()
  };
}

/**
 * Calculate statistics for historical returns
 */
export function calculateHistoricalStats(data: HistoricalYearData[]) {
  if (data.length === 0) return null;
  
  const stockReturns = data.map(d => d.stockReturn);
  const bondReturns = data.map(d => d.bondReturn);
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
    
    csv_path = os.path.join(project_root, 'src/lib/calc/data/ie-data.csv')
    output_path = os.path.join(project_root, 'src/lib/calc/data/historical-data.ts')
    
    print("Parsing CSV data...")
    monthly_data = parse_csv_file(csv_path)
    print(f"Parsed {len(monthly_data)} monthly data points")
    
    print("Calculating annual returns...")
    annual_data = calculate_annual_returns(monthly_data)
    print(f"Generated {len(annual_data)} annual data points")
    
    if annual_data:
        print(f"Data range: {annual_data[0].year} - {annual_data[-1].year}")
        
        print("Generating TypeScript file...")
        generate_typescript_file(annual_data, output_path)
        print(f"Generated {output_path}")
        
        # Print sample statistics
        if len(annual_data) > 0:
            stock_returns = [float(d.stock_return) for d in annual_data]
            bond_returns = [float(d.bond_return) for d in annual_data]
            inflation_rates = [float(d.inflation_rate) for d in annual_data]
            
            print(f"\nSample Statistics:")
            print(f"Stocks - Mean: {sum(stock_returns)/len(stock_returns):6.2%}, Std: {(sum([(x-sum(stock_returns)/len(stock_returns))**2 for x in stock_returns])/len(stock_returns))**0.5:6.2%}")
            print(f"Bonds  - Mean: {sum(bond_returns)/len(bond_returns):6.2%}, Std: {(sum([(x-sum(bond_returns)/len(bond_returns))**2 for x in bond_returns])/len(bond_returns))**0.5:6.2%}")
            print(f"Infl   - Mean: {sum(inflation_rates)/len(inflation_rates):6.2%}, Std: {(sum([(x-sum(inflation_rates)/len(inflation_rates))**2 for x in inflation_rates])/len(inflation_rates))**0.5:6.2%}")
    else:
        print("No annual data generated!")

if __name__ == "__main__":
    main()