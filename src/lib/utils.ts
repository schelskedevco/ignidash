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
  const withCapitalized = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);

  if (withCapitalized.startsWith('Tax Free')) return 'Tax-Free' + withCapitalized.slice(8);
  if (withCapitalized.startsWith('Tax Deferred')) return 'Tax-Deferred' + withCapitalized.slice(12);
  if (withCapitalized.startsWith('Annual Fica')) return 'Annual FICA' + withCapitalized.slice(11);
  if (withCapitalized.startsWith('Cumulative Fica')) return 'Cumul. FICA' + withCapitalized.slice(15);
  if (withCapitalized.startsWith('Fica Tax')) return 'FICA Tax' + withCapitalized.slice(8);
  if (withCapitalized.startsWith('Tax Exempt')) return 'Tax-Exempt' + withCapitalized.slice(10);
  if (withCapitalized.startsWith('Cumulative')) return 'Cumul.' + withCapitalized.slice(10);

  return withCapitalized;
}
