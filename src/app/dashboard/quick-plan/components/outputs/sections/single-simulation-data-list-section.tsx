'use client';

import { useMemo, useState, Fragment } from 'react';

import type { SimulationDataPoint, SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/catalyst/description-list';
import { Subheading } from '@/components/catalyst/heading';
import { formatNumber } from '@/lib/utils';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import { Switch } from '@/components/catalyst/switch';

interface DataListCardProps {
  dp: SimulationDataPoint;
}

function PortfolioDataListCard({ dp }: DataListCardProps) {
  const [checked, setChecked] = useState(true);

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
    <Card>
      <div className="flex w-full items-center justify-between">
        <Subheading level={4}>Portfolio</Subheading>
        <Switch aria-label="Toggle portfolio data view mode" checked={checked} onChange={setChecked} />
      </div>
      <DescriptionList>
        {checked ? (
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
        <DescriptionTerm className="font-semibold">Total Value</DescriptionTerm>
        <DescriptionDetails className="font-semibold">{formatNumber(totalValue, 2, '$')}</DescriptionDetails>
      </DescriptionList>
    </Card>
  );
}

function CashFlowDataListCard({ dp }: DataListCardProps) {
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
  const netCashFlow = grossIncome - incomeTax - totalExpenses;

  return (
    <div className="flex flex-col gap-2">
      <Card className="mb-0">
        <Subheading level={4}>Income</Subheading>
        <DescriptionList>
          <DescriptionTerm>Income Tax</DescriptionTerm>
          <DescriptionDetails>{formatNumber(incomeTax, 2, '$')}</DescriptionDetails>

          <DescriptionTerm className="font-semibold">Net Income</DescriptionTerm>
          <DescriptionDetails className="font-semibold">{formatNumber(grossIncome, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
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
      <Card className="mt-0">
        <Subheading level={4}>Cash Flow</Subheading>
        <DescriptionList>
          <DescriptionTerm>Savings Rate</DescriptionTerm>
          <DescriptionDetails>{grossIncome > 0 ? `${formatNumber((netCashFlow / grossIncome) * 100, 1)}%` : 'N/A'}</DescriptionDetails>

          <DescriptionTerm className="font-semibold">Net</DescriptionTerm>
          <DescriptionDetails className="font-semibold">{formatNumber(netCashFlow, 2, '$')}</DescriptionDetails>
        </DescriptionList>
      </Card>
    </div>
  );
}

function TaxesDataListCard({ dp }: DataListCardProps) {
  return null;
}

interface SingleSimulationDataListSectionProps {
  simulation: SimulationResult;
  selectedAge: number;
}

export default function SingleSimulationDataListSection({ simulation, selectedAge }: SingleSimulationDataListSectionProps) {
  const dp = useMemo(() => {
    return simulation.data.find((dp) => {
      const startAge = simulation.context.startAge;
      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(dp.date).getFullYear();

      return currDateYear - startDateYear + startAge === selectedAge;
    });
  }, [simulation, selectedAge]);

  if (!dp) return null;

  return (
    <SectionContainer showBottomBorder>
      <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @5xl:grid-cols-3">
        <PortfolioDataListCard dp={dp} />
        <CashFlowDataListCard dp={dp} />
        <TaxesDataListCard dp={dp} />
      </div>
    </SectionContainer>
  );
}
