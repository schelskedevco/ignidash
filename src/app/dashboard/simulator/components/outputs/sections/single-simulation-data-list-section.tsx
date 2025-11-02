'use client';

import { useMemo, memo } from 'react';

import type { SimulationDataPoint, SimulationResult } from '@/lib/calc/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { formatNumber } from '@/lib/utils';
import Card from '@/components/ui/card';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { Subheading } from '@/components/catalyst/heading';
import { SimulationDataExtractor } from '@/lib/calc/data-extractors/simulation-data-extractor';
import { useResultsCategory } from '@/lib/stores/simulator-store';

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
  const { totalTaxesAndPenalties } = SimulationDataExtractor.getTaxAmountsByType(dp);
  const { earnedIncome, totalExpenses, operatingCashFlow } = SimulationDataExtractor.getOperatingCashFlowData(dp);
  const savingsRate = SimulationDataExtractor.getSavingsRate(dp);

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Details</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Earned Income</DescriptionTerm>
          <DescriptionDetails>{formatNumber(earnedIncome, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Taxes & Penalties</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalTaxesAndPenalties, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Expenses</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalExpenses, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Savings Rate</DescriptionTerm>
          <DescriptionDetails className="font-bold">
            {savingsRate !== null ? `${formatNumber(savingsRate * 100, 1)}%` : 'N/A'}
          </DescriptionDetails>

          <DescriptionTerm className="font-bold">Operating Cash Flow*</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(operatingCashFlow, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
      <p className="text-muted-foreground mt-2 ml-2 text-sm/6">
        *Earned income minus all taxes and expenses. Investment income and portfolio withdrawals are excluded.
      </p>
    </div>
  );
}

function TaxesDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const { grossOrdinaryIncome, grossCapGains, grossIncome } = SimulationDataExtractor.getTaxableIncomeSources(dp, selectedAge);
  const { incomeTax, capGainsTax, totalTaxesAndPenalties } = SimulationDataExtractor.getTaxAmountsByType(dp);

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Details</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Ordinary Income</DescriptionTerm>
        <DescriptionDetails>{formatNumber(grossOrdinaryIncome, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Income Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTax, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Realized Capital Gains & Dividends</DescriptionTerm>
        <DescriptionDetails>{formatNumber(grossCapGains, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Capital Gains Tax</DescriptionTerm>
        <DescriptionDetails>{formatNumber(capGainsTax, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Gross Income</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(grossIncome, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="font-bold">Total Taxes & Penalties</DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalTaxesAndPenalties, 2, '$')}</DescriptionDetails>
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

function ContributionsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const annualContributions = portfolioData.contributionsForPeriod;

  const { operatingCashFlow } = SimulationDataExtractor.getOperatingCashFlowData(dp);

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Details</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Total Portfolio Value</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalValue, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Operating Cash Flow*</DescriptionTerm>
          <DescriptionDetails>{formatNumber(operatingCashFlow, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Annual Contributions</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(annualContributions, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
      <p className="text-muted-foreground mt-2 ml-2 text-sm/6">
        *Earned income minus all taxes and expenses. Investment income and portfolio withdrawals are excluded.
      </p>
    </div>
  );
}

function WithdrawalsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const annualWithdrawals = portfolioData.withdrawalsForPeriod;

  const { operatingCashFlow } = SimulationDataExtractor.getOperatingCashFlowData(dp);
  const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(dp);

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Details</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Total Portfolio Value</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalValue, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Operating Cash Flow*</DescriptionTerm>
          <DescriptionDetails>{formatNumber(operatingCashFlow, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Annual Withdrawals</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(annualWithdrawals, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Withdrawal Rate</DescriptionTerm>
          <DescriptionDetails className="font-bold">
            {withdrawalRate !== null ? `${formatNumber(withdrawalRate * 100, 1)}%` : 'N/A'}
          </DescriptionDetails>
        </DescriptionList>
      </Card>
      <p className="text-muted-foreground mt-2 ml-2 text-sm/6">
        *Earned income minus all taxes and expenses. Investment income and portfolio withdrawals are excluded.
      </p>
    </div>
  );
}

interface SingleSimulationDataListSectionProps {
  simulation: SimulationResult;
  selectedAge: number;
}

function SingleSimulationDataListSection({ simulation, selectedAge }: SingleSimulationDataListSectionProps) {
  const resultsCategory = useResultsCategory();

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
  switch (resultsCategory) {
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
    default:
      return (
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>No data available for the selected view.</p>
        </div>
      );
  }
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationDataListSection);
