import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, fractionDigits: number = 2, prefix: string = ''): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1000000000) return sign + prefix + (absNum / 1000000000).toFixed(2) + 'B';
  if (absNum >= 1000000) return sign + prefix + (absNum / 1000000).toFixed(2) + 'M';
  if (absNum >= 1000) return sign + prefix + (absNum / 1000).toFixed(1) + 'k';
  return sign + prefix + absNum.toFixed(fractionDigits);
}

export function formatNumberAsNumber(num: number): number {
  return parseFloat(num.toFixed(2));
}

export function formatChartString(input: string): string {
  const withSpaces = input.replace(/(?<!^)([A-Z])/g, ' $1');
  let result = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);

  const replacements: Array<[string, string]> = [
    ['Ltcg', 'LTCG'],
    ['Tax Free', 'Tax-Free'],
    ['Tax Deferred', 'Tax-Deferred'],
    ['Tax Deductible', 'Tax-Deductible'],
    ['Tax Exempt', 'Tax-Exempt'],
    ['Fica', 'FICA'],
    ['Niit', 'NIIT'],
    ['Cumulative', 'Cumul.'],
    ['Required Minimum Distributions', 'RMDs'],
    ['Early Withdrawal Penalties', 'EW Penalties'],
    ['Percentage', '%'],
    ['Cagr', 'CAGR'],
  ];

  for (const [search, replace] of replacements) {
    result = result.replace(new RegExp(search, 'g'), replace);
  }

  return result;
}
