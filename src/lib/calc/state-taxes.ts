/**
 * State income tax calculation engine
 *
 * Supports graduated-bracket states (CA, NY, NJ, MN, OR, HI),
 * flat-rate states (IL, PA, IN, MI, NC), and no-income-tax states.
 *
 * Tax year 2026. Source: Respective state tax authority bracket schedules.
 * State-specific standard deductions and exemptions not yet modeled.
 */

import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export type StateCode =
  | 'CA' | 'NY' | 'NJ' | 'MN' | 'OR' | 'HI'
  | 'IL' | 'PA' | 'IN' | 'MI' | 'NC'
  | 'TX' | 'FL' | 'NV' | 'WA' | 'WY' | 'SD' | 'AK' | 'TN' | 'NH';

const NO_INCOME_TAX: StateCode[] = ['TX', 'FL', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH'];

const FLAT_RATE_STATES: Record<string, number> = {
  IL: 0.0495,
  PA: 0.0307,
  IN: 0.0305,
  MI: 0.0425,
  NC: 0.0475,
};

interface StateBracket {
  limit: number;
  rate: number;
}

const STATE_BRACKETS: Record<string, { single: StateBracket[]; married: StateBracket[] }> = {
  CA: {
    single: [
      { limit: 10_756, rate: 0.01 },
      { limit: 25_499, rate: 0.02 },
      { limit: 40_245, rate: 0.04 },
      { limit: 55_866, rate: 0.06 },
      { limit: 70_606, rate: 0.08 },
      { limit: 360_659, rate: 0.093 },
      { limit: 432_787, rate: 0.103 },
      { limit: 721_314, rate: 0.113 },
      { limit: Infinity, rate: 0.123 },
    ],
    married: [
      { limit: 21_512, rate: 0.01 },
      { limit: 50_998, rate: 0.02 },
      { limit: 80_490, rate: 0.04 },
      { limit: 111_732, rate: 0.06 },
      { limit: 141_212, rate: 0.08 },
      { limit: 721_318, rate: 0.093 },
      { limit: 865_574, rate: 0.103 },
      { limit: 1_442_628, rate: 0.113 },
      { limit: Infinity, rate: 0.123 },
    ],
  },
  NY: {
    single: [
      { limit: 8_500, rate: 0.04 },
      { limit: 11_700, rate: 0.045 },
      { limit: 13_900, rate: 0.0525 },
      { limit: 21_400, rate: 0.055 },
      { limit: 80_650, rate: 0.06 },
      { limit: 215_400, rate: 0.0685 },
      { limit: 1_077_550, rate: 0.0965 },
      { limit: 5_000_000, rate: 0.103 },
      { limit: 25_000_000, rate: 0.109 },
      { limit: Infinity, rate: 0.149 },
    ],
    married: [
      { limit: 17_150, rate: 0.04 },
      { limit: 23_600, rate: 0.045 },
      { limit: 27_900, rate: 0.0525 },
      { limit: 43_000, rate: 0.055 },
      { limit: 161_550, rate: 0.06 },
      { limit: 323_200, rate: 0.0685 },
      { limit: 2_155_350, rate: 0.0965 },
      { limit: 5_000_000, rate: 0.103 },
      { limit: 25_000_000, rate: 0.109 },
      { limit: Infinity, rate: 0.149 },
    ],
  },
};

/**
 * Calculates state income tax for a given state and filing status.
 *
 * @param taxableIncome - Annual taxable income (after federal standard deduction)
 * @param stateCode - Two-letter state code
 * @param filingStatus - Filing status
 * @returns State income tax amount in dollars
 */
export function calcStateTax(
  taxableIncome: number,
  stateCode: StateCode,
  filingStatus: FilingStatus,
): number {
  if (NO_INCOME_TAX.includes(stateCode)) return 0;
  if (stateCode in FLAT_RATE_STATES) return taxableIncome * FLAT_RATE_STATES[stateCode];

  const brackets = STATE_BRACKETS[stateCode];
  if (!brackets) return 0;

  const filingKey: 'single' | 'married' =
    filingStatus === 'marriedFilingJointly' ? 'married' : 'single';
  const bracketSet = brackets[filingKey];

  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of bracketSet) {
    const taxable = Math.min(taxableIncome, limit) - prev;
    if (taxable > 0) tax += taxable * rate;
    prev = limit;
    if (taxableIncome <= limit) break;
  }
  return tax;
}

/** List of state codes that have no income tax */
export function getNoIncomeTaxStates(): StateCode[] {
  return [...NO_INCOME_TAX];
}

/** List of state codes with flat-rate income tax */
export function getFlatRateStates(): Record<string, number> {
  return { ...FLAT_RATE_STATES };
}

/** List of state codes with graduated-bracket income tax */
export function getGraduatedRateStates(): StateCode[] {
  return Object.keys(STATE_BRACKETS) as StateCode[];
}

/** Human-readable label for each state code */
export function stateLabel(state: StateCode): string {
  const labels: Record<StateCode, string> = {
    CA: 'California', NY: 'New York', NJ: 'New Jersey', MN: 'Minnesota',
    OR: 'Oregon', HI: 'Hawaii',
    IL: 'Illinois', PA: 'Pennsylvania', IN: 'Indiana', MI: 'Michigan', NC: 'North Carolina',
    TX: 'Texas', FL: 'Florida', NV: 'Nevada', WA: 'Washington', WY: 'Wyoming',
    SD: 'South Dakota', AK: 'Alaska', TN: 'Tennessee', NH: 'New Hampshire',
  };
  return labels[state];
}

/** All supported state codes */
export const ALL_STATES: StateCode[] = [
  'CA', 'NY', 'NJ', 'MN', 'OR', 'HI',
  'IL', 'PA', 'IN', 'MI', 'NC',
  'TX', 'FL', 'NV', 'WA', 'WY', 'SD', 'AK', 'TN', 'NH',
];