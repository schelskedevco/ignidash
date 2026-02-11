export const CURRENCY_CONFIG = {
  currency: 'USD',
  locale: 'en-US',
  symbol: '$',
} as const;

const currencyFormatter = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
  style: 'currency',
  currency: CURRENCY_CONFIG.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterWithCents = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
  style: 'currency',
  currency: CURRENCY_CONFIG.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number, options?: { cents?: boolean }): string {
  if (options?.cents) {
    return currencyFormatterWithCents.format(amount);
  }
  return currencyFormatter.format(amount);
}

export function formatCompactCurrency(amount: number, fractionDigits: number = 2): string {
  const absNum = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const symbol = CURRENCY_CONFIG.symbol;

  if (absNum >= 1000000000) return sign + symbol + (absNum / 1000000000).toFixed(2) + 'B';
  if (absNum >= 1000000) return sign + symbol + (absNum / 1000000).toFixed(2) + 'M';
  if (absNum >= 1000) return sign + symbol + (absNum / 1000).toFixed(1) + 'k';

  return sign + symbol + absNum.toFixed(fractionDigits);
}

export function getCurrencySymbol(): string {
  return CURRENCY_CONFIG.symbol;
}

export function formatCurrencyPlaceholder(amount: number): string {
  return currencyFormatter.format(amount);
}
