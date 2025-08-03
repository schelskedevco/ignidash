import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, fractionDigits: number = 2) {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1000000000) return sign + (absNum / 1000000000).toFixed(2) + 'B';
  if (absNum >= 1000000) return sign + (absNum / 1000000).toFixed(2) + 'M';
  if (absNum >= 1000) return sign + (absNum / 1000).toFixed(1) + 'k';
  return sign + absNum.toFixed(fractionDigits);
}
