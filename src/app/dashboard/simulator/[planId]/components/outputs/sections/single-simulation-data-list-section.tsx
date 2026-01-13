'use client';

import { useMemo, memo } from 'react';
import { InfoIcon } from 'lucide-react';

import type { SimulationDataPoint, SimulationResult } from '@/lib/calc/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';
import Card from '@/components/ui/card';
import { SingleSimulationCategory } from '@/lib/types/simulation-category';
import { Subheading } from '@/components/catalyst/heading';
import { SimulationDataExtractor } from '@/lib/calc/data-extractors/simulation-data-extractor';
import { sumTransactions } from '@/lib/calc/asset';
import { useSingleSimulationCategory } from '@/lib/stores/simulator-store';

function NetPortfolioChangeTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Calculated as annual returns plus contributions, minus withdrawals.</p>
      </TooltipContent>
    </Tooltip>
  );
}

function NetCashFlowTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Earned income, employer match, tax-exempt income, and Social Security, minus taxes and expenses.</p>
        <p>Dividends and interest (automatically reinvested) are tracked separately, as are withdrawals.</p>
      </TooltipContent>
    </Tooltip>
  );
}

function SavingsRateTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        <p>The percentage of after-tax income that you save rather than spend.</p>
        <p>Calculated with the same income sources as Cash Flow.</p>
      </TooltipContent>
    </Tooltip>
  );
}

function GrossIncomeTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Total taxable income before adjustments and deductions.</p>
        <p>Includes earned income, Social Security, retirement distributions, interest, dividends, and realized capital gains.</p>
      </TooltipContent>
    </Tooltip>
  );
}

function TotalIncomeTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Gross income plus tax-exempt income and the non-taxable portion of Social Security.</p>
        <p>Tax-exempt income includes gifts, inheritances, or other non-taxable sources.</p>
      </TooltipContent>
    </Tooltip>
  );
}

function WithdrawalRateTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        <p>The percentage of your total portfolio value that you withdraw annually.</p>
        <p>This rate helps assess the sustainability of your withdrawals over time.</p>
      </TooltipContent>
    </Tooltip>
  );
}

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

  const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);
  const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Context</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Annual Returns</DescriptionTerm>
        <DescriptionDetails>{formatNumber(stockAmount + bondAmount + cashAmount, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Annual Contributions</DescriptionTerm>
        <DescriptionDetails>{formatNumber(annualContributions, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Annual Withdrawals</DescriptionTerm>
        <DescriptionDetails>{formatNumber(annualWithdrawals, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="flex items-center gap-3 font-bold">
          Net Portfolio Change
          <NetPortfolioChangeTooltip />
        </DescriptionTerm>
        <DescriptionDetails className="font-bold">
          {formatNumber(stockAmount + bondAmount + cashAmount + annualContributions - annualWithdrawals, 2, '$')}
        </DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function CashFlowDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const { netCashFlow } = SimulationDataExtractor.getCashFlowData(dp);
  const savingsRate = SimulationDataExtractor.getSavingsRate(dp);

  const portfolioData = dp.portfolio;

  const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);
  const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Context</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Annual Contributions</DescriptionTerm>
          <DescriptionDetails>{formatNumber(annualContributions, 2, '$')}</DescriptionDetails>

          <DescriptionTerm>Annual Withdrawals</DescriptionTerm>
          <DescriptionDetails>{formatNumber(annualWithdrawals, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="flex items-center gap-3 font-bold">
            Net Cash Flow
            <NetCashFlowTooltip />
          </DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="flex items-center gap-3 font-bold">
            Savings Rate
            <SavingsRateTooltip />
          </DescriptionTerm>
          <DescriptionDetails className="font-bold">
            {savingsRate !== null ? `${formatNumber(savingsRate * 100, 1)}%` : 'N/A'}
          </DescriptionDetails>
        </DescriptionList>
      </Card>
    </div>
  );
}

function TaxesDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const taxesData = dp.taxes;

  const incomeTaxedAsOrdinary = taxesData?.incomeSources.incomeTaxedAsOrdinary ?? 0;
  const incomeTaxedAsCapGains = taxesData?.incomeSources.incomeTaxedAsCapGains ?? 0;

  const grossIncome = taxesData?.incomeSources.grossIncome ?? 0;
  const totalIncome = taxesData?.incomeSources.totalIncome ?? 0;

  return (
    <Card className="my-0">
      <Subheading level={4}>
        <span className="mr-2">Context</span>
        <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
      </Subheading>
      <DescriptionList>
        <DescriptionTerm>Income Taxed as Ordinary</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTaxedAsOrdinary, 2, '$')}</DescriptionDetails>

        <DescriptionTerm>Income Taxed as Capital Gains</DescriptionTerm>
        <DescriptionDetails>{formatNumber(incomeTaxedAsCapGains, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="flex items-center gap-3 font-bold">
          Gross Income
          <GrossIncomeTooltip />
        </DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(grossIncome, 2, '$')}</DescriptionDetails>

        <DescriptionTerm className="flex items-center gap-3 font-bold">
          Total Income <TotalIncomeTooltip />
        </DescriptionTerm>
        <DescriptionDetails className="font-bold">{formatNumber(totalIncome, 2, '$')}</DescriptionDetails>
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
        <span className="mr-2">Context</span>
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
  const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);

  const { netCashFlow } = SimulationDataExtractor.getCashFlowData(dp);
  const savingsRate = SimulationDataExtractor.getSavingsRate(dp);

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Context</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Total Portfolio Value</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalValue, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="flex items-center gap-3">
            Net Cash Flow
            <NetCashFlowTooltip />
          </DescriptionTerm>
          <DescriptionDetails>{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Annual Contributions</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(annualContributions, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="flex items-center gap-3 font-bold">
            Savings Rate
            <SavingsRateTooltip />
          </DescriptionTerm>
          <DescriptionDetails className="font-bold">
            {savingsRate !== null ? `${formatNumber(savingsRate * 100, 1)}%` : 'N/A'}
          </DescriptionDetails>
        </DescriptionList>
      </Card>
    </div>
  );
}

function WithdrawalsDataListCardV2({ dp, selectedAge }: DataListCardProps) {
  const portfolioData = dp.portfolio;
  const totalValue = portfolioData.totalValue;
  const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);

  const { netCashFlow } = SimulationDataExtractor.getCashFlowData(dp);
  const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(dp);

  return (
    <div>
      <Card className="my-0">
        <Subheading level={4}>
          <span className="mr-2">Context</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        <DescriptionList>
          <DescriptionTerm>Total Portfolio Value</DescriptionTerm>
          <DescriptionDetails>{formatNumber(totalValue, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="flex items-center gap-3">
            Net Cash Flow
            <NetCashFlowTooltip />
          </DescriptionTerm>
          <DescriptionDetails>{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-bold">Annual Withdrawals</DescriptionTerm>
          <DescriptionDetails className="font-bold">{formatNumber(annualWithdrawals, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="flex items-center gap-3 font-bold">
            Withdrawal Rate <WithdrawalRateTooltip />
          </DescriptionTerm>
          <DescriptionDetails className="font-bold">
            {withdrawalRate !== null ? `${formatNumber(withdrawalRate * 100, 1)}%` : 'N/A'}
          </DescriptionDetails>
        </DescriptionList>
      </Card>
    </div>
  );
}

interface SingleSimulationDataListSectionProps {
  simulation: SimulationResult;
  selectedAge: number;
}

function SingleSimulationDataListSection({ simulation, selectedAge }: SingleSimulationDataListSectionProps) {
  const resultsCategory = useSingleSimulationCategory();

  const dp = useMemo(() => simulation.data.find((dp) => Math.floor(dp.age) === selectedAge), [simulation, selectedAge]);

  if (!dp) return null;

  const props: DataListCardProps = { dp, selectedAge };
  switch (resultsCategory) {
    case SingleSimulationCategory.Portfolio:
      return (
        <div className="grid grid-cols-1 gap-2">
          <PortfolioDataListCardV2 {...props} />
        </div>
      );
    case SingleSimulationCategory.CashFlow:
      return (
        <div className="grid grid-cols-1 gap-2">
          <CashFlowDataListCardV2 {...props} />
        </div>
      );
    case SingleSimulationCategory.Taxes:
      return (
        <div className="grid grid-cols-1 gap-2">
          <TaxesDataListCardV2 {...props} />
        </div>
      );
    case SingleSimulationCategory.Returns:
      return (
        <div className="grid grid-cols-1 gap-2">
          <ReturnsDataListCardV2 {...props} />
        </div>
      );
    case SingleSimulationCategory.Contributions:
      return (
        <div className="grid grid-cols-1 gap-2">
          <ContributionsDataListCardV2 {...props} />
        </div>
      );
    case SingleSimulationCategory.Withdrawals:
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
