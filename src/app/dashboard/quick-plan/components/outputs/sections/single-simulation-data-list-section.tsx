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
          {formatNumber(stockAmount + bondAmount + cashAmount + annualContributions - annualWithdrawals, 2, '$')}
        </DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function CashFlowDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const taxesData = dp.taxes;

  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
  const earlyWithdrawalPenalties = taxesData?.earlyWithdrawalPenalties.totalPenaltyAmount ?? 0;
  const totalTaxesAndPenalties = incomeTax + capGainsTax + earlyWithdrawalPenalties;

  const incomesData = dp.incomes;
  const expensesData = dp.expenses;

  const earnedIncome = incomesData?.totalGrossIncome ?? 0;
  const earnedIncomeAfterTax = earnedIncome - totalTaxesAndPenalties;
  const totalExpenses = expensesData?.totalExpenses ?? 0;
  const operatingCashFlow = earnedIncomeAfterTax - totalExpenses;
  const savingsRate = earnedIncomeAfterTax > 0 ? (operatingCashFlow / earnedIncomeAfterTax) * 100 : null;

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Details</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Gross Earned Income</DescriptionTerm>
          <DescriptionDetails>{formatNumber(earnedIncome, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Taxes & Penalties</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalTaxesAndPenalties, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Expenses</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalExpenses, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Savings Rate</DescriptionTerm>
          <DescriptionDetails className="font-bold">{savingsRate !== null ? `${formatNumber(savingsRate, 1)}%` : 'N/A'}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Operating Cash Flow</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(operatingCashFlow, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
    </div>
  );
}

/* FIX TAXES */
function TaxesDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;

  const annualRealizedGains = portfolioData.realizedGainsForPeriod;

  let annualTaxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
    switch (account.type) {
      case '401k':
      case 'ira':
      case 'hsa':
        annualTaxDeferredWithdrawals += account.withdrawalsForPeriod;
        break;
      default:
        break;
    }
  }

  const incomesData = dp.incomes;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + annualTaxDeferredWithdrawals;
  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
  const totalTaxLiability = incomeTax + capGainsTax;

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

          <DescriptionTerm>Realized Capital Gains</DescriptionTerm>
          <DescriptionDetails>{formatNumber(annualRealizedGains, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Capital Gains Tax</DescriptionTerm>
          <DescriptionDetails>{formatNumber(capGainsTax, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Total Tax Liability</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(totalTaxLiability, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
      <p className="text-muted-foreground mt-2 ml-2 text-sm/6">*Includes tax-deferred withdrawals from 401(k), HSA, and IRA.</p>
    </div>
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
        <DescriptionTerm>Stock Holdings</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(totalValue * stocksAllocation, 2, '$')} (${formatNumber(stocksAllocation * 100, 1)}%)`}</DescriptionDetails>

        <DescriptionTerm>Bond Holdings</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(totalValue * bondsAllocation, 2, '$')} (${formatNumber(bondsAllocation * 100, 1)}%)`}</DescriptionDetails>

        <DescriptionTerm>Cash Holdings</DescriptionTerm>
        <DescriptionDetails>{`${formatNumber(totalValue * cashAllocation, 2, '$')} (${formatNumber(cashAllocation * 100, 1)}%)`}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Portfolio Value</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

/* FIX CONTRIB AND WITHDRAW */
function ContributionsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const annualContributions = portfolioData.contributionsForPeriod;

  let annualTaxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
    switch (account.type) {
      case '401k':
      case 'ira':
      case 'hsa':
        annualTaxDeferredWithdrawals += account.withdrawalsForPeriod;
        break;
      default:
        break;
    }
  }

  const incomesData = dp.incomes;
  const expensesData = dp.expenses;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + annualTaxDeferredWithdrawals;
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

        <DescriptionTerm className="font-bold">Annual Contributions</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(annualContributions, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function WithdrawalsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const annualWithdrawals = portfolioData.withdrawalsForPeriod;

  let annualTaxDeferredWithdrawals = 0;
  for (const account of Object.values(portfolioData.perAccountData)) {
    switch (account.type) {
      case '401k':
      case 'ira':
      case 'hsa':
        annualTaxDeferredWithdrawals += account.withdrawalsForPeriod;
        break;
      default:
        break;
    }
  }

  const incomesData = dp.incomes;
  const expensesData = dp.expenses;
  const taxesData = dp.taxes;

  const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
  const grossIncome = ordinaryIncome + annualTaxDeferredWithdrawals;
  const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
  const totalExpenses = expensesData?.totalExpenses ?? 0;
  const netIncome = grossIncome - incomeTax;
  const netCashFlow = netIncome - totalExpenses;
  const withdrawalRate = totalValue + annualWithdrawals > 0 ? (annualWithdrawals / (totalValue + annualWithdrawals)) * 100 : null;

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

        <DescriptionTerm className="font-bold">Annual Withdrawals</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(annualWithdrawals, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Withdrawal Rate</DescriptionTerm>
        <DescriptionDetails className="font-bold">
          {withdrawalRate !== null ? `${formatNumber(withdrawalRate, 1)}%` : 'N/A'}
        </DescriptionDetails>
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
