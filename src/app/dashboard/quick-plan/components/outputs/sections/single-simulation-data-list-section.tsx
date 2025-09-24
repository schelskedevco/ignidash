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

function PortfolioDataListCardV2({ dp }: DataListCardProps) {
  const returnsData = dp.returns;

  const {
    stocks: stockAmount,
    bonds: bondAmount,
    cash: cashAmount,
  } = returnsData?.returnAmountsForPeriod ?? { stocks: 0, bonds: 0, cash: 0 };

  const portfolioData = dp.portfolio;

  const totalWithdrawals = portfolioData.withdrawalsForPeriod;
  const totalContributions = portfolioData.contributionsForPeriod;

  return (
    <Card className="my-0">
      <Subheading level={4}>Portfolio Change</Subheading>
      <DescriptionList>
        <DescriptionTerm>Total Return Amount</DescriptionTerm>
        <DescriptionDetails>{formatNumber(stockAmount + bondAmount + cashAmount, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Total Contributions</DescriptionTerm>
        <DescriptionDetails>{formatNumber(totalContributions, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Total Withdrawals</DescriptionTerm>
        <DescriptionDetails>{formatNumber(totalWithdrawals, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Net Change</DescriptionTerm>
        <DescriptionDetails className="font-bold">
          {formatNumber(stockAmount + bondAmount + cashAmount + totalContributions - totalWithdrawals, 2, '$')}
        </DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function CashFlowDataListCardV2({ dp }: DataListCardProps) {
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
      <Subheading level={4}>Cash Flow</Subheading>
      <DescriptionList>
        <DescriptionTerm>Gross Income</DescriptionTerm>
        <DescriptionDetails>{formatNumber(grossIncome, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Deferred Withdrawals</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxDeferredWithdrawals, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Income Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTax, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Net Income</DescriptionTerm>
        <DescriptionDetails>{formatNumber(netIncome, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Total Expenses</DescriptionTerm>
        <DescriptionDetails>{formatNumber(totalExpenses, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Savings Rate</DescriptionTerm>
        <DescriptionDetails className="font-bold">
          {grossIncome > 0 ? `${formatNumber((netCashFlow / grossIncome) * 100, 1)}%` : 'N/A'}
        </DescriptionDetails>

        <DescriptionTerm className="font-bold">Net</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function PortfolioDataListCard({ dp }: DataListCardProps) {
  const [portfolioChecked, setPortfolioChecked] = useState(false);

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
        <Subheading level={4}>{portfolioChecked ? 'Portfolio by Tax Treatment' : 'Portfolio by Asset Class'}</Subheading>
        <Switch aria-label="Toggle portfolio data view mode" checked={portfolioChecked} onChange={setPortfolioChecked} />
      </div>
      <DescriptionList>
        {!portfolioChecked ? (
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
            <DescriptionTerm>Taxable Brokerage</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(taxable, 2, '$')} (${formatNumber((taxable / totalValue) * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Tax Deferred</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(taxDeferred, 2, '$')} (${formatNumber((taxDeferred / totalValue) * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Tax Free</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(taxFree, 2, '$')} (${formatNumber((taxFree / totalValue) * 100, 1)}%)`}</DescriptionDetails>

            <DescriptionTerm>Cash Savings</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(cashSavings, 2, '$')} (${formatNumber((cashSavings / totalValue) * 100, 1)}%)`}</DescriptionDetails>
          </>
        )}
        <DescriptionTerm className="font-bold">Total Value</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
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

  if (taxable === 0 && taxDeferred === 0 && taxFree === 0 && cashSavings === 0) {
    return (
      <Card className="my-0">
        <div className="flex size-full items-center justify-center">No withdrawals.</div>
      </Card>
    );
  }

  return (
    <Card className="my-0">
      <Subheading level={4}>Annual Withdrawals</Subheading>
      <DescriptionList>
        <DescriptionTerm>Taxable Brokerage</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxable, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Deferred</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxDeferred, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Free</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxFree, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Cash Savings</DescriptionTerm>
        <DescriptionDetails>{formatNumber(cashSavings, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Withdrawals</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(taxable + taxDeferred + taxFree + cashSavings, 2, '$')}</DescriptionDetails>
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

  if (taxable === 0 && taxDeferred === 0 && taxFree === 0 && cashSavings === 0) {
    return (
      <Card className="my-0">
        <div className="flex size-full items-center justify-center">No contributions.</div>
      </Card>
    );
  }

  return (
    <Card className="my-0">
      <Subheading level={4}>Annual Contributions</Subheading>
      <DescriptionList>
        <DescriptionTerm>Taxable Brokerage</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxable, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Deferred</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxDeferred, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Tax Free</DescriptionTerm>
        <DescriptionDetails>{formatNumber(taxFree, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Cash Savings</DescriptionTerm>
        <DescriptionDetails>{formatNumber(cashSavings, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Contributions</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(taxable + taxDeferred + taxFree + cashSavings, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function TaxesDataListCard({ dp }: DataListCardProps) {
  const [taxesDataView, setTaxesDataView] = useState<'marginalRates' | 'effectiveRates' | 'taxAmounts' | 'taxableIncome'>('taxAmounts');

  const taxesData = dp.taxes;

  const topMarginalIncomeTaxRate = taxesData?.incomeTaxes.topMarginalTaxRate ?? 0;
  const topMarginalCapitalGainsTaxRate = taxesData?.capitalGainsTaxes.topMarginalCapitalGainsTaxRate ?? 0;

  const effectiveIncomeTaxRate = taxesData?.incomeTaxes.effectiveIncomeTaxRate ?? 0;
  const effectiveCapitalGainsTaxRate = taxesData?.capitalGainsTaxes.effectiveCapitalGainsTaxRate ?? 0;

  const incomeTaxAmount = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const capitalGainsTaxAmount = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;

  const taxableOrdinaryIncome = taxesData?.incomeTaxes.taxableOrdinaryIncome ?? 0;
  const taxableCapitalGains = taxesData?.capitalGainsTaxes.taxableCapitalGains ?? 0;
  const totalTaxableIncome = taxesData?.totalTaxableIncome ?? 0;

  let taxesDescListComponents = null;
  switch (taxesDataView) {
    case 'marginalRates':
      taxesDescListComponents = (
        <>
          <DescriptionTerm>Top Marginal Income Tax Rate</DescriptionTerm>
          <DescriptionDetails>{`${formatNumber(topMarginalIncomeTaxRate * 100, 2)}%`}</DescriptionDetails>

          <DescriptionTerm>Top Marginal CG Tax Rate</DescriptionTerm>
          <DescriptionDetails>{`${formatNumber(topMarginalCapitalGainsTaxRate * 100, 2)}%`}</DescriptionDetails>
        </>
      );
      break;
    case 'effectiveRates':
      taxesDescListComponents = (
        <>
          <DescriptionTerm>Effective Income Tax Rate</DescriptionTerm>
          <DescriptionDetails>{`${formatNumber(effectiveIncomeTaxRate * 100, 2)}%`}</DescriptionDetails>

          <DescriptionTerm>Effective CG Tax Rate</DescriptionTerm>
          <DescriptionDetails>{`${formatNumber(effectiveCapitalGainsTaxRate * 100, 2)}%`}</DescriptionDetails>
        </>
      );
      break;
    case 'taxAmounts':
      taxesDescListComponents = (
        <>
          <DescriptionTerm>Income Tax</DescriptionTerm>
          <DescriptionDetails>{formatNumber(incomeTaxAmount, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Capital Gains Tax</DescriptionTerm>
          <DescriptionDetails>{formatNumber(capitalGainsTaxAmount, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Total Tax Liability</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(incomeTaxAmount + capitalGainsTaxAmount, 2, '$')}</DescriptionDetails>
        </>
      );
      break;
    case 'taxableIncome':
      taxesDescListComponents = (
        <>
          <DescriptionTerm>Taxable Ordinary Income</DescriptionTerm>
          <DescriptionDetails>{formatNumber(taxableOrdinaryIncome, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Taxable Capital Gains</DescriptionTerm>
          <DescriptionDetails>{formatNumber(taxableCapitalGains, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Total Taxable Income</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(totalTaxableIncome, 2, '$')}</DescriptionDetails>
        </>
      );
      break;
  }

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
      <DescriptionList>{taxesDescListComponents}</DescriptionList>
    </Card>
  );
}

function ReturnsDataListCard({ dp }: DataListCardProps) {
  const [returnsChecked, setReturnsChecked] = useState(false);

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
            <DescriptionTerm>Stocks Rate</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(stockReturn * 100, 2)}%`}</DescriptionDetails>

            <DescriptionTerm>Bonds Rate</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(bondReturn * 100, 2)}%`}</DescriptionDetails>

            <DescriptionTerm>Cash Rate</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(cashReturn * 100, 2)}%`}</DescriptionDetails>

            <DescriptionTerm>Inflation Rate</DescriptionTerm>
            <DescriptionDetails>{`${formatNumber(inflationRate * 100, 2)}%`}</DescriptionDetails>
          </>
        ) : (
          <>
            <DescriptionTerm>Stocks Amount</DescriptionTerm>
            <DescriptionDetails>{formatNumber(stockAmount, 2, '$')}</DescriptionDetails>

            <DescriptionTerm>Bonds Amount</DescriptionTerm>
            <DescriptionDetails>{formatNumber(bondAmount, 2, '$')}</DescriptionDetails>

            <DescriptionTerm>Cash Amount</DescriptionTerm>
            <DescriptionDetails>{formatNumber(cashAmount, 2, '$')}</DescriptionDetails>

            <DescriptionTerm className="font-bold">Total Amount</DescriptionTerm>
            <DescriptionDetails className="font-bold">{formatNumber(stockAmount + bondAmount + cashAmount, 2, '$')}</DescriptionDetails>
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

        <DescriptionTerm className="font-bold">Net Income</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(netIncome, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

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
        <div className="grid grid-cols-1 gap-2">
          <PortfolioDataListCardV2 dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.CashFlow:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2">
          <CashFlowDataListCardV2 dp={dp} />
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
        <div className="grid grid-cols-1 gap-2 @6xl:grid-cols-3">
          <PortfolioDataListCard dp={dp} />
          <ContributionsDataListCard dp={dp} />
          <IncomeDataListCard dp={dp} />
        </div>
      );
      break;
    case SimulationCategory.Withdrawals:
      dataListComponents = (
        <div className="grid grid-cols-1 gap-2 @6xl:grid-cols-3">
          <PortfolioDataListCard dp={dp} />
          <WithdrawalsDataListCard dp={dp} />
          <TaxesDataListCard dp={dp} />
        </div>
      );
      break;
  }

  return <SectionContainer showBottomBorder>{dataListComponents}</SectionContainer>;
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationDataListSection);
