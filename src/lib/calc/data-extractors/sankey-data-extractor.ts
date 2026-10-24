/**
 * Sankey diagram data extraction for cash flow visualization
 *
 * Transforms a single year of simulation data into a Sankey-compatible
 * node/link structure showing how money flows from income sources
 * through taxes/expenses to savings and debt payments.
 */

import type { SimulationDataPoint } from '@/lib/calc/simulation-engine';
import { SimulationDataExtractor } from './simulation-data-extractor';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SankeyNode {
  name: string;
  category: 'income' | 'outflow' | 'intermediary';
}

export interface SankeyLink {
  source: number; // index into nodes array
  target: number; // index into nodes array
  value: number;
}

export interface SankeyInputData {
  /** Unique node definitions (name + category) */
  nodes: SankeyNode[];
  /** Flow links between nodes */
  links: SankeyLink[];
  /** Label for the Sankey (year/age description) */
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum absolute value for a link to be included (avoid clutter) */
const MIN_LINK_VALUE = 50;

// ─── Color mapping helpers ────────────────────────────────────────────────────

export const SANKEY_NODE_COLORS: Record<string, string> = {
  // Income sources
  'Earned Income': 'var(--chart-1)',
  'Social Security': 'var(--chart-2)',
  'Tax-Free Income': 'var(--chart-3)',
  'Employer Match': 'var(--chart-4)',
  'Liquidated Savings': 'var(--chart-5)',
  'Asset Sales': 'var(--chart-6)',

  // Outflows
  Expenses: 'var(--chart-7)',
  'Federal Income Tax': 'var(--chart-8)',
  'FICA Tax': 'var(--chart-1)',
  'Capital Gains Tax': 'var(--chart-2)',
  'Net Investment Income Tax': 'var(--chart-3)',
  'Early Withdrawal Penalties': 'var(--chart-4)',
  'Invested Savings': 'var(--chart-5)',
  'Debt Payments': 'var(--chart-6)',
  'Asset Purchases': 'var(--chart-7)',
  'Property Tax': 'var(--chart-8)',
};

// ─── Extractor ────────────────────────────────────────────────────────────────

export class SankeyDataExtractor {
  /**
   * Builds a Sankey flow diagram for a single simulation year.
   *
   * The diagram has two layers:
   *   Left (income): earned income, SS, tax-free income, employer match, liquidations, asset sales
   *   Right (outflows): expenses, taxes, invested savings, debt payments, asset purchases
   *
   * @param dp - A single simulation data point
   * @param age - The age for this data point (for labeling)
   * @returns Sankey input data with nodes and links
   */
  static extractForDataPoint(dp: SimulationDataPoint, age: number): SankeyInputData {
    const cashFlow = SimulationDataExtractor.getCashFlowData(dp);
    const taxes = SimulationDataExtractor.getTaxAmountsByType(dp);

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    const nodeIndex = new Map<string, number>();

    const addNode = (name: string, category: SankeyNode['category']): number => {
      const existing = nodeIndex.get(name);
      if (existing !== undefined) return existing;
      const idx = nodes.length;
      nodes.push({ name, category });
      nodeIndex.set(name, idx);
      return idx;
    };

    const addLink = (source: number, target: number, value: number) => {
      if (Math.abs(value) < MIN_LINK_VALUE) return;
      links.push({ source, target, value });
    };

    // ── Income Sources (left side) ─────────────────────────────────────────

    const incomeEntries: { name: string; value: number }[] = [
      { name: 'Earned Income', value: cashFlow.earnedIncome },
      { name: 'Social Security', value: cashFlow.socialSecurityIncome },
      { name: 'Tax-Free Income', value: cashFlow.taxFreeIncome },
      { name: 'Employer Match', value: cashFlow.employerMatch },
      { name: 'Liquidated Savings', value: cashFlow.amountLiquidated },
      { name: 'Asset Sales', value: cashFlow.assetSaleProceeds },
    ];

    // ── Outflows (right side) ─────────────────────────────────────────────

    const outflowEntries: { name: string; value: number }[] = [
      { name: 'Expenses', value: cashFlow.totalExpenses },
      { name: 'Federal Income Tax', value: taxes.federalIncomeTax },
      { name: 'FICA Tax', value: taxes.ficaTax },
      { name: 'Capital Gains Tax', value: taxes.capitalGainsTax },
      { name: 'Net Investment Income Tax', value: taxes.niit },
      { name: 'Early Withdrawal Penalties', value: taxes.earlyWithdrawalPenalties },
      { name: 'Property Tax', value: taxes.propertyTax },
      { name: 'Invested Savings', value: cashFlow.amountInvested },
      { name: 'Debt Payments', value: cashFlow.totalDebtPayments },
      { name: 'Asset Purchases', value: cashFlow.assetPurchaseOutlay },
    ];

    // ── Build nodes & links ───────────────────────────────────────────────

    // Create all income nodes first, then outflow nodes
    for (const entry of incomeEntries) {
      if (Math.abs(entry.value) >= MIN_LINK_VALUE) {
        addNode(entry.name, 'income');
      }
    }

    for (const entry of outflowEntries) {
      if (Math.abs(entry.value) >= MIN_LINK_VALUE) {
        addNode(entry.name, 'outflow');
      }
    }

    // Create "Total Income" intermediary node
    const totalIncomeIdx = addNode('Total Income', 'intermediary');

    // Link each income source → Total Income
    for (const entry of incomeEntries) {
      const srcIdx = nodeIndex.get(entry.name);
      if (srcIdx !== undefined && entry.value >= MIN_LINK_VALUE) {
        addLink(srcIdx, totalIncomeIdx, entry.value);
      }
    }

    // Link Total Income → each outflow
    for (const entry of outflowEntries) {
      const tgtIdx = nodeIndex.get(entry.name);
      if (tgtIdx !== undefined && entry.value >= MIN_LINK_VALUE) {
        addLink(totalIncomeIdx, tgtIdx, entry.value);
      }
    }

    return {
      nodes,
      links,
      label: `Age ${age}`,
    };
  }

  /**
   * Extracts Sankey data for all years and returns an array
   * indexed by simulation year.
   */
  static extractForAllYears(data: SimulationDataPoint[]): SankeyInputData[] {
    return data.slice(1).map((dp) => {
      const age = Math.floor(dp.age);
      return SankeyDataExtractor.extractForDataPoint(dp, age);
    });
  }
}