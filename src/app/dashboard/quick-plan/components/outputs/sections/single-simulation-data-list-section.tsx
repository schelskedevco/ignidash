'use client';

import { useMemo, useState, Fragment, memo } from 'react';

import type { SimulationDataPoint, SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';
import { formatNumber } from '@/lib/utils';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Switch } from '@/components/catalyst/switch';
import { Select } from '@/components/catalyst/select';
import { SimulationCategory } from '@/lib/types/simulation-category';

interface DataListCardProps {
  dp: SimulationDataPoint;
}

function PortfolioDataListCard({ dp }: DataListCardProps) {
  const [portfolioChecked, setPortfolioChecked] = useState(true);

  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;

  const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
  const stocksAllocation = assetAllocation.stocks;
  const bondsAllocation = assetAllocation.bonds;
  const cashAllocation = assetAllocation.cash;

  let cashSavings = 0;
  let taxable = 0;
  let taxDeferred = 0;
  let taxFree = 0;

  for (const account of Object.values(portfolioData.perAccountData)) {
    switch (account.type) {
      case 'savings':
        cashSavings += account.totalValue;
        break;
      case 'taxableBrokerage':
        taxable += account.totalValue;
        break;
      case '401k':
      case 'ira':
      case 'hsa':
        taxDeferred += account.totalValue;
        break;
      case 'roth401k':
      case 'rothIra':
        taxFree += account.totalValue;
        break;
    }
  }

  return (
    <Card className="my-0">
      <div className="flex w-full items-center justify-between">
        <Subheading level={4}>Portfolio</Subheading>
        <Switch aria-label="Toggle portfolio data view mode" checked={portfolioChecked} onChange={setPortfolioChecked} />
      </div>
      <DescriptionList>
        {portfolioChecked ? (
          <>
            <DescriptionTerm>Stocks</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(totalValue * stocksAllocation, 2, '$')} (${formatNumber(stocksAllocation * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Bonds</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(totalValue * bondsAllocation, 2, '$')} (${formatNumber(bondsAllocation * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Cash</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(totalValue * cashAllocation, 2, '$')} (${formatNumber(cashAllocation * 100, 1)}%)`}</DescriptionDetails>
          </>
        ) : (
          <>
            <DescriptionTerm>Taxable</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(taxable, 2, '$')} (${formatNumber((taxable / totalValue) * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Tax Deferred</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(taxDeferred, 2, '$')} (${formatNumber((taxDeferred / totalValue) * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Tax Free</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(taxFree, 2, '$')} (${formatNumber((taxFree / totalValue) * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Cash Savings</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(cashSavings, 2, '$')} (${formatNumber((cashSavings / totalValue) * 100, 1)}%)`}</DescriptionDetails>
          </>
        )}
        <DescriptionTerm className="font-semibold">Total</DescriptionTerm>
        <DescriptionDetails className="font-semibold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function WithdrawalsDataListCard({ dp }: DataListCardProps) {
  const portfolioData = dp.portfolio;

  let cashSavings = 0;
  let taxable = 0;
  let taxDeferred = 0;
  let taxFree = 0;

  for (const account of Object.values(portfolioData.perAccountData)) {
    switch (account.type) {
      case 'savings':
        cashSavings += account.withdrawalsForPeriod;
        break;
      case 'taxableBrokerage':
        taxable += account.withdrawalsForPeriod;
        break;
      case '401k':
      case 'ira':
      case 'hsa':
        taxDeferred += account.withdrawalsForPeriod;
        break;
      case 'roth401k':
      case 'rothIra':
        taxFree += account.withdrawalsForPeriod;
        break;
    }
  }

  return (
    <Card className="my-0">
      <Subheading level={4}>Withdrawals</Subheading>
      <DescriptionList>
        <DescriptionTerm>Taxable</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxable, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Deferred</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxDeferred, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Free</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxFree, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Cash Savings</DescriptionTerm>
        <DescriptionDetails>{formatNumber(cashSavings, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-semibold">Total</DescriptionTerm>
        <DescriptionDetails className="font-semibold">
          {formatNumber(taxable + taxDeferred + taxFree + cashSavings, 2, '$')}
        </DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function ContributionsDataListCard({ dp }: DataListCardProps) {
  const portfolioData = dp.portfolio;

  let cashSavings = 0;
  let taxable = 0;
  let taxDeferred = 0;
  let taxFree = 0;

  for (const account of Object.values(portfolioData.perAccountData)) {
    switch (account.type) {
      case 'savings':
        cashSavings += account.contributionsForPeriod;
        break;
      case 'taxableBrokerage':
        taxable += account.contributionsForPeriod;
        break;
      case '401k':
      case 'ira':
      case 'hsa':
        taxDeferred += account.contributionsForPeriod;
        break;
      case 'roth401k':
      case 'rothIra':
        taxFree += account.contributionsForPeriod;
        break;
    }
  }

  return (
    <Card className="my-0">
      <Subheading level={4}>Contributions</Subheading>
      <DescriptionList>
        <DescriptionTerm>Taxable</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxable, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Deferred</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxDeferred, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Free</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxFree, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Cash Savings</DescriptionTerm>
        <DescriptionDetails>{formatNumber(cashSavings, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-semibold">Total</DescriptionTerm>
        <DescriptionDetails className="font-semibold">
          {formatNumber(taxable + taxDeferred + taxFree + cashSavings, 2, '$')}
        </DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function TaxesDataListCard({ dp }: DataListCardProps) {
  const [taxesDataView, setTaxesDataView] = useState<'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'taxableIncome'>('marginalRates');

  const taxesData = dp.taxes;

  const incomeTaxAmount = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const capitalGainsTaxAmount = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;

  return (
    <Card className="my-0">
      <div className="flex w-full items-center justify-between">
        <Subheading level={4}>Taxes</Subheading>
        <Select
          className="max-w-64"
          id="taxes-data-view"
          name="taxes-data-view"
          value={taxesDataView}
          onChange={(e) => setTaxesDataView(e.target.value as 'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'taxableIncome')}
        >
          <optgroup label="Tax Rates">
            <option value="marginalRates">Top Marginal Rates</option>
            <option value="effectiveRates">Effective Rates</option>
          </optgroup>
          <optgroup label="Dollar Amounts">
            <option value="taxAmounts">Tax Amounts</option>
            <option value="taxableIncome">Taxable Income</option>
          </optgroup>
        </Select>
      </div>
      <DescriptionList>
        <DescriptionTerm>Income Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTaxAmount, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Capital Gains Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(capitalGainsTaxAmount, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-semibold">Total Tax Liability</DescriptionTerm>
        <DescriptionDetails className="font-semibold">{formatNumber(incomeTaxAmount + capitalGainsTaxAmount, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function ReturnsDataListCard({ dp }: DataListCardProps) {
  const [returnsChecked, setReturnsChecked] = useState(true);

  const returnsData = dp.returns;

  const { stocks: stockReturn, bonds: bondReturn, cash: cashReturn } = returnsData?.annualReturnRates ?? { stocks: 0, bonds: 0, cash: 0 };
  const inflationRate = returnsData?.annualInflationRate ?? 0;
  const {
    stocks: stockAmount,
    bonds: bondAmount,
    cash: cashAmount,
  } = returnsData?.returnAmountsForPeriod ?? { stocks: 0, bonds: 0, cash: 0 };

  return (
    <Card className="my-0">
      <div className="flex w-full items-center justify-between">
        <Subheading level={4}>{returnsChecked ? 'Return Rates' : 'Return Amounts'}</Subheading>
        <Switch aria-label="Toggle returns data view mode" checked={returnsChecked} onChange={setReturnsChecked} />
      </div>
      <DescriptionList>
        {returnsChecked ? (
          <>
            <DescriptionTerm>Stocks</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(stockReturn * 100, 2)}%`}</DescriptionDetails>

            <DescriptionTerm>Bonds</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(bondReturn * 100, 2)}%`}</DescriptionDetails>

            <DescriptionTerm>Cash</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(cashReturn * 100, 2)}%`}</DescriptionDetails>

            <DescriptionTerm>Inflation</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(inflationRate * 100, 2)}%`}</DescriptionDetails>
          </>
        ) : (
          <>
            <DescriptionTerm>Stocks</DescriptionTerm>
            <DescriptionDetails>{formatNumber(stockAmount, 2, '$')}</DescriptionDetails>

            <DescriptionTerm>Bonds</DescriptionTerm>
            <DescriptionDetails>{formatNumber(bondAmount, 2, '$')}</DescriptionDetails>

            <DescriptionTerm>Cash</DescriptionTerm>
            <DescriptionDetails>{formatNumber(cashAmount, 2, '$')}</DescriptionDetails>

            <DescriptionTerm className="font-semibold">Total</DescriptionTerm>
            <DescriptionDetails className="font-semibold">{formatNumber(stockAmount + bondAmount + cashAmount, 2, '$')}</DescriptionDetails>
          </>
        )}
      </DescriptionList>
    </Card>
  );
}

function IncomeDataListCard({ dp }: DataListCardProps) {
  let taxDeferredWithdrawals = 0;
  for (const account of Object.values(dp.portfolio.perAccountData)) {
    switch (account.type) {
      case '401k':
      case 'ira':
      case 'hsa':
        taxDeferredWithdrawals += account.withdrawalsForPeriod;
        break;
      default:
        break;
    }
  }

  const grossIncome = (dp.incomes?.totalGrossIncome ?? 0) + taxDeferredWithdrawals;
  const incomeTax = dp.taxes?.incomeTaxes.incomeTaxAmount ?? 0;
  const netIncome = grossIncome - incomeTax;

  return (
    <Card className="my-0">
      <Subheading level={4}>Income</Subheading>
      <DescriptionList>
        {Object.values(dp.incomes?.perIncomeData ?? {}).map((income) => (
          <Fragment key={income.id}>
            <DescriptionTerm>{income.name}</DescriptionTerm>
            <DescriptionDetails>{formatNumber(income.grossIncome, 2, '$')}</DescriptionDetails>
          </Fragment>
        ))}

        {taxDeferredWithdrawals > 0 && (
          <>
            <DescriptionTerm>Tax Deferred Withdrawals</DescriptionTerm>
            <DescriptionDetails>{formatNumber(taxDeferredWithdrawals, 2, '$')}</DescriptionDetails>
          </>
        )}

        <DescriptionTerm>Income Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTax, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-semibold">Net Income</DescriptionTerm>
        <DescriptionDetails className="font-semibold">{formatNumber(netIncome, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function ExpensesDataListCard({ dp }: DataListCardProps) {
  const totalExpenses = dp.expenses?.totalExpenses ?? 0;

  return (
    <Card className="my-0">
      <Subheading level={4}>Expenses</Subheading>
      <DescriptionList>
        {Object.values(dp.expenses?.perExpenseData ?? {}).map((expense) => (
          <Fragment key={expense.id}>
            <DescriptionTerm>{expense.name}</DescriptionTerm>
            <DescriptionDetails>{formatNumber(expense.amount, 2, '$')}</DescriptionDetails>
          </Fragment>
        ))}
        <DescriptionTerm className="font-semibold">Total Expenses</DescriptionTerm>
        <DescriptionDetails className="font-semibold">{formatNumber(totalExpenses, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function NetCashFlowDataListCard({ dp }: DataListCardProps) {
  let taxDeferredWithdrawals = 0;
  for (const account of Object.values(dp.portfolio.perAccountData)) {
    switch (account.type) {
      case '401k':
      case 'ira':
      case 'hsa':
        taxDeferredWithdrawals += account.withdrawalsForPeriod;
        break;
      default:
        break;
    }
  }

  const grossIncome = (dp.incomes?.totalGrossIncome ?? 0) + taxDeferredWithdrawals;
  const incomeTax = dp.taxes?.incomeTaxes.incomeTaxAmount ?? 0;
  const totalExpenses = dp.expenses?.totalExpenses ?? 0;
  const netIncome = grossIncome - incomeTax;
  const netCashFlow = netIncome - totalExpenses;

  return (
    <Card className="my-0">
      <Subheading level={4}>Net Cash Flow</Subheading>
      <DescriptionList>
        <DescriptionTerm>Savings Rate</DescriptionTerm>
        <DescriptionDetails>{grossIncome > 0 ? `${formatNumber((netCashFlow / grossIncome) * 100, 1)}%` : 'N/A'}</DescriptionDetails>

        <DescriptionTerm className="font-semibold">Net</DescriptionTerm>
        <DescriptionDetails className="font-semibold">{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

// export interface CapitalGainsTaxesData {
//   taxableCapitalGains: number;
//   capitalGainsTaxAmount: number;
//   effectiveCapitalGainsTaxRate: number;
//   topMarginalCapitalGainsTaxRate: number;
//   netCapitalGains: number;
// }

// export interface IncomeTaxesData {
//   taxableOrdinaryIncome: number;
//   incomeTaxAmount: number;
//   effectiveIncomeTaxRate: number;
//   topMarginalTaxRate: number;
//   netIncome: number;
//   capitalLossDeduction?: number;
// }

// export interface TaxesData {
//   incomeTaxes: IncomeTaxesData;
//   capitalGainsTaxes: CapitalGainsTaxesData;
//   totalTaxableIncome: number;
// }

interface SingleSimulationDataListSectionProps {
  simulation: SimulationResult;
  selectedAge: number;
  currentCategory: SimulationCategory;
}

function SingleSimulationDataListSection({ simulation, selectedAge, currentCategory }: SingleSimulationDataListSectionProps) {
  const dp = useMemo(() => {
    return simulation.data.find((dp) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(dp.date).getFullYear();

      return currDateYear - startDateYear + startAge === selectedAge;
    });
  }, [simulation, selectedAge]);

  if (!dp) return null;

  let dataListComponents = null;
  switch (currentCategory) {
    case SimulationCategory.Portfolio:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2 @6xl:grid-cols-3">
          <PortfolioDataListCard dp={dp} />
          <WithdrawalsDataListCard dp={dp} />
          <ContributionsDataListCard dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.CashFlow:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2 @6xl:grid-cols-3">
          <IncomeDataListCard dp={dp} />
          <ExpensesDataListCard dp={dp} />
          <NetCashFlowDataListCard dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.Taxes:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2 @6xl:grid-cols-3">
          <IncomeDataListCard dp={dp} />
          <WithdrawalsDataListCard dp={dp} />
          <TaxesDataListCard dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.Returns:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2">
          <PortfolioDataListCard dp={dp} />
          <ReturnsDataListCard dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.Contributions:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2">
          <ContributionsDataListCard dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.Withdrawals:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2">
          <WithdrawalsDataListCard dp={dp} />
        </div>
      );
      break;
  }

  return <SectionContainer showBottomBorder>{dataListComponents}</SectionContainer>;
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationDataListSection);
