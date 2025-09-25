'use client';

import { useMemo, memo } from 'react';

import type { SimulationDataPoint, SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber } from '@/lib/utils';
import Card from '@/components/ui/card';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { Subheading } from '@/components/catalyst/heading';

interface DataListCardProps {
  dp: SimulationDataPoint;
  selectedAge: number;
}

function PortfolioDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const returnsData = dp.returns;

  const {
    stocks: stockAmount,
    bonds: bondAmount,
    cash: cashAmount,
  } = returnsData?.returnAmountsForPeriod ?? { stocks: 0, bonds: 0, cash: 0 };

  const portfolioData = dp.portfolio;

  const annualWithdrawals = portfolioData.withdrawalsForPeriod;
  const annualContributions = portfolioData.contributionsForPeriod;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Annual Returns</DescriptionTerm>
        <DescriptionDetails>{formatNumber(stockAmount + bondAmount + cashAmount, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Annual Contributions</DescriptionTerm>
        <DescriptionDetails>{formatNumber(annualContributions, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Annual Withdrawals</DescriptionTerm>
        <DescriptionDetails>{formatNumber(annualWithdrawals, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Net Portfolio Change</DescriptionTerm>
        <DescriptionDetails className="font-bold">
          {formatNumber(stockAmount + bondAmount + cashAmount + annualContributions + annualWithdrawals, 2, '$')}
        </DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function CashFlowDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;

  let taxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
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

  const incomesData = dp.incomes;
  const expensesData = dp.expenses;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + taxDeferredWithdrawals;
  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const totalExpenses = expensesData?.totalExpenses ?? 0;
  const netIncome = grossIncome - incomeTax;
  const netCashFlow = netIncome - totalExpenses;
  const savingsRate = netIncome > 0 ? (netCashFlow / netIncome) * 100 : null;

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Details</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Gross Income*</DescriptionTerm>
          <DescriptionDetails>{formatNumber(grossIncome, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Income Tax</DescriptionTerm>
          <DescriptionDetails>{formatNumber(incomeTax, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Net Income</DescriptionTerm>
          <DescriptionDetails>{formatNumber(netIncome, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Total Expenses</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalExpenses, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Savings Rate</DescriptionTerm>
          <DescriptionDetails className="font-bold">{savingsRate !== null ? `${formatNumber(savingsRate, 1)}%` : 'N/A'}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Net Cash Flow</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
      <p className="text-muted-foreground mt-2 ml-2 text-sm/6">*Includes tax-deferred withdrawals from 401(k), HSA, and IRA.</p>
    </div>
  );
}

function TaxesDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;

  const realizedGains = portfolioData.realizedGainsForPeriod;

  let taxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
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

  const incomesData = dp.incomes;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + taxDeferredWithdrawals;
  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
  const totalTaxLiability = incomeTax + capGainsTax;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Total Gross Income</DescriptionTerm>
        <DescriptionDetails>{formatNumber(grossIncome, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Income Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTax, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Realized Capital Gains</DescriptionTerm>
        <DescriptionDetails>{formatNumber(realizedGains, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Capital Gains Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(capGainsTax, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Tax Liability</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalTaxLiability, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function ReturnsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;

  const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
  const stocksAllocation = assetAllocation.stocks;
  const bondsAllocation = assetAllocation.bonds;
  const cashAllocation = assetAllocation.cash;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Stocks</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(totalValue * stocksAllocation, 2, '$')} (${formatNumber(stocksAllocation * 100, 1)}%)`}</DescriptionDetails>

        <DescriptionTerm>Bonds</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(totalValue * bondsAllocation, 2, '$')} (${formatNumber(bondsAllocation * 100, 1)}%)`}</DescriptionDetails>

        <DescriptionTerm>Cash</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(totalValue * cashAllocation, 2, '$')} (${formatNumber(cashAllocation * 100, 1)}%)`}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function ContributionsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const totalContributions = portfolioData.contributionsForPeriod;

  let taxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
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

  const incomesData = dp.incomes;
  const expensesData = dp.expenses;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + taxDeferredWithdrawals;
  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const totalExpenses = expensesData?.totalExpenses ?? 0;
  const netIncome = grossIncome - incomeTax;
  const netCashFlow = netIncome - totalExpenses;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(totalValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Net Cash Flow</DescriptionTerm>
        <DescriptionDetails>{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Contributions</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalContributions, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function WithdrawalsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const totalWithdrawals = portfolioData.withdrawalsForPeriod;

  let taxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
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

  const incomesData = dp.incomes;
  const expensesData = dp.expenses;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + taxDeferredWithdrawals;
  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const totalExpenses = expensesData?.totalExpenses ?? 0;
  const netIncome = grossIncome - incomeTax;
  const netCashFlow = netIncome - totalExpenses;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails>{formatNumber(totalValue, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Net Cash Flow</DescriptionTerm>
        <DescriptionDetails>{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Withdrawals</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalWithdrawals, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Withdrawal Rate</DescriptionTerm>
        <DescriptionDetails className="font-bold">{`${formatNumber((Math.abs(totalWithdrawals) / (totalValue + totalWithdrawals)) * 100, 1)}%`}</DescriptionDetails>
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

  const props: DataListCardProps = { dp, selectedAge };
  switch (currentCategory) {
    case SimulationCategory.Portfolio:
      return (
        <div className="grid grid-cols-1 gap-2">
          <PortfolioDataListCardV2 {...props} />
        </div>
      );
    case SimulationCategory.CashFlow:
      return (
        <div className="grid grid-cols-1 gap-2">
          <CashFlowDataListCardV2 {...props} />
        </div>
      );
    case SimulationCategory.Taxes:
      return (
        <div className="grid grid-cols-1 gap-2">
          <TaxesDataListCardV2 {...props} />
        </div>
      );
    case SimulationCategory.Returns:
      return (
        <div className="grid grid-cols-1 gap-2">
          <ReturnsDataListCardV2 {...props} />
        </div>
      );
    case SimulationCategory.Contributions:
      return (
        <div className="grid grid-cols-1 gap-2">
          <ContributionsDataListCardV2 {...props} />
        </div>
      );
    case SimulationCategory.Withdrawals:
      return (
        <div className="grid grid-cols-1 gap-2">
          <WithdrawalsDataListCardV2 {...props} />
        </div>
      );
  }
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationDataListSection);
