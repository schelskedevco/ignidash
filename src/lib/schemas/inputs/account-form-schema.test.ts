import { describe, it, expect } from 'vitest';
import {
  isRothAccount,
  isTraditionalAccount,
  isInvestmentAccount,
  accountTypeForDisplay,
  taxCategoryFromAccountType,
} from './account-form-schema';
import type { AccountInputs } from './account-form-schema';

const ALL_ACCOUNT_TYPES: AccountInputs['type'][] = [
  'savings',
  'taxableBrokerage',
  'roth401k',
  'roth403b',
  'rothIra',
  '401k',
  '403b',
  'ira',
  'hsa',
];

describe('isRothAccount', () => {
  it('should return true for roth account types', () => {
    expect(isRothAccount('roth401k')).toBe(true);
    expect(isRothAccount('roth403b')).toBe(true);
    expect(isRothAccount('rothIra')).toBe(true);
  });

  it('should return false for non-roth types', () => {
    expect(isRothAccount('savings')).toBe(false);
    expect(isRothAccount('401k')).toBe(false);
    expect(isRothAccount('ira')).toBe(false);
    expect(isRothAccount('hsa')).toBe(false);
    expect(isRothAccount('taxableBrokerage')).toBe(false);
  });
});

describe('isTraditionalAccount', () => {
  it('should return true for traditional account types', () => {
    expect(isTraditionalAccount('401k')).toBe(true);
    expect(isTraditionalAccount('403b')).toBe(true);
    expect(isTraditionalAccount('ira')).toBe(true);
  });

  it('should return false for non-traditional types', () => {
    expect(isTraditionalAccount('savings')).toBe(false);
    expect(isTraditionalAccount('roth401k')).toBe(false);
    expect(isTraditionalAccount('hsa')).toBe(false);
    expect(isTraditionalAccount('taxableBrokerage')).toBe(false);
  });
});

describe('isInvestmentAccount', () => {
  it('should return true for all types except savings', () => {
    for (const type of ALL_ACCOUNT_TYPES) {
      expect(isInvestmentAccount(type)).toBe(type !== 'savings');
    }
  });
});

describe('accountTypeForDisplay', () => {
  it('should return display strings for all types', () => {
    expect(accountTypeForDisplay('savings')).toBe('Savings');
    expect(accountTypeForDisplay('taxableBrokerage')).toBe('Taxable');
    expect(accountTypeForDisplay('roth401k')).toBe('Roth 401(k)');
    expect(accountTypeForDisplay('roth403b')).toBe('Roth 403(b)');
    expect(accountTypeForDisplay('rothIra')).toBe('Roth IRA');
    expect(accountTypeForDisplay('401k')).toBe('401(k)');
    expect(accountTypeForDisplay('403b')).toBe('403(b)');
    expect(accountTypeForDisplay('ira')).toBe('IRA');
    expect(accountTypeForDisplay('hsa')).toBe('HSA');
  });
});

describe('taxCategoryFromAccountType', () => {
  it('should map savings to cashSavings', () => {
    expect(taxCategoryFromAccountType('savings')).toBe('cashSavings');
  });

  it('should map taxableBrokerage to taxable', () => {
    expect(taxCategoryFromAccountType('taxableBrokerage')).toBe('taxable');
  });

  it('should map roth types to taxFree', () => {
    expect(taxCategoryFromAccountType('roth401k')).toBe('taxFree');
    expect(taxCategoryFromAccountType('roth403b')).toBe('taxFree');
    expect(taxCategoryFromAccountType('rothIra')).toBe('taxFree');
  });

  it('should map traditional and HSA to taxDeferred', () => {
    expect(taxCategoryFromAccountType('401k')).toBe('taxDeferred');
    expect(taxCategoryFromAccountType('403b')).toBe('taxDeferred');
    expect(taxCategoryFromAccountType('ira')).toBe('taxDeferred');
    expect(taxCategoryFromAccountType('hsa')).toBe('taxDeferred');
  });
});
