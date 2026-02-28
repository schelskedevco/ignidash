/** Reference line overlay modes for tax charts (bracket thresholds, NIIT threshold). */

export type TaxableIncomeReferenceLineMode = 'marginalFederalIncomeTaxRates' | 'marginalCapitalGainsTaxRates' | 'hideReferenceLines';

export type AgiReferenceLineMode = 'niitThreshold' | 'hideReferenceLines';

export const TAXABLE_INCOME_REFERENCE_LINE_MODES: readonly TaxableIncomeReferenceLineMode[] = [
  'marginalFederalIncomeTaxRates',
  'marginalCapitalGainsTaxRates',
  'hideReferenceLines',
] as const;

export const AGI_REFERENCE_LINE_MODES: readonly AgiReferenceLineMode[] = ['niitThreshold', 'hideReferenceLines'] as const;
