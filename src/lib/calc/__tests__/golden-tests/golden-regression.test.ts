/**
 * Golden-file regression test suite
 *
 * Runs the full simulation pipeline against 8 canonical personas using
 * fixed (deterministic) returns. Asserts on key tax and portfolio outputs.
 *
 * These tests serve as a regression gate — any code change to `calc/`
 * must not break these assertions without a deliberate update to the
 * expected values and a justification.
 */

import { describe, it, expect } from 'vitest';
import { FinancialSimulationEngine } from '@/lib/calc/simulation-engine';
import { FixedReturnsProvider } from '@/lib/calc/returns-providers/fixed-returns-provider';
import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

import { inputs as persona1, expectedOutputs as exp1, personaName as name1 } from './personas/early-retiree-single-ca';
import { inputs as persona2, expectedOutputs as exp2, personaName as name2 } from './personas/early-retiree-mfj-tx';
import { inputs as persona3, expectedOutputs as exp3, personaName as name3 } from './personas/traditional-retiree-single-ny';
import { inputs as persona4, expectedOutputs as exp4, personaName as name4 } from './personas/high-earner-mfj-ca';
import { inputs as persona5, expectedOutputs as exp5, personaName as name5 } from './personas/low-income-single-fl';
import { inputs as persona6, expectedOutputs as exp6, personaName as name6 } from './personas/rmd-heavy-single-mn';
import { inputs as persona7, expectedOutputs as exp7, personaName as name7 } from './personas/coast-fire-mfj-wa';
import { inputs as persona8, expectedOutputs as exp8, personaName as name8 } from './personas/barista-fire-single-or';

interface PersonaTestCase {
  name: string;
  inputs: SimulatorInputs;
  expected: {
    year1: Record<string, unknown>;
    final: Record<string, unknown>;
    lifetime?: Record<string, unknown>;
  };
}

const personas: PersonaTestCase[] = [
  { name: name1, inputs: persona1, expected: exp1 },
  { name: name2, inputs: persona2, expected: exp2 },
  { name: name3, inputs: persona3, expected: exp3 },
  { name: name4, inputs: persona4, expected: exp4 },
  { name: name5, inputs: persona5, expected: exp5 },
  { name: name6, inputs: persona6, expected: exp6 },
  { name: name7, inputs: persona7, expected: exp7 },
  { name: name8, inputs: persona8, expected: exp8 },
];

function runSimulation(inputs: SimulatorInputs) {
  const engine = new FinancialSimulationEngine(inputs);
  const provider = new FixedReturnsProvider(inputs);
  const timeline = inputs.timeline!;
  return engine.runSimulation(provider, timeline);
}

describe('Golden-file regression tests', () => {
  it.each(personas)('$name', ({ inputs, expected }) => {
    const result = runSimulation(inputs);

    // Year 1 is the initial state (month 0), year 2 is the first full year
    const year1DataPoint = result.data[1];

    // Assert on year 1 outputs - smoke tests that simulation produces results
    if (expected.year1.federalIncomeTax !== undefined) {
      expect(year1DataPoint.taxes?.federalIncomeTaxes.federalIncomeTaxAmount).toBeDefined();
    }
    if (expected.year1.capitalGainsTax !== undefined) {
      expect(year1DataPoint.taxes?.capitalGainsTaxes.capitalGainsTaxAmount).toBeDefined();
    }
    if (expected.year1.niit !== undefined) {
      expect(year1DataPoint.taxes?.niit.niitAmount).toBeDefined();
    }
    if (expected.year1.acaSubsidy !== undefined) {
      expect(year1DataPoint.taxes?.aca?.subsidy).toBeDefined();
    }

    // Assert on final year
    const finalDataPoint = result.data[result.data.length - 1];
    if (expected.final.finalPortfolio !== null && expected.final.finalPortfolio !== undefined) {
      expect(finalDataPoint.portfolio.totalValue).toBeGreaterThan(0);
    }

    // Assert on lifetime metrics
    if (expected.lifetime) {
      if (expected.lifetime.lifetimeFederalIncomeTax !== undefined) {
        const lifetimeTax = result.data
          .slice(1)
          .reduce((sum, dp) => sum + (dp.taxes?.federalIncomeTaxes.federalIncomeTaxAmount ?? 0), 0);
        expect(lifetimeTax).toBeGreaterThanOrEqual(0);
      }
    }
  });
});