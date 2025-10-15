'use client';

import { EyeIcon, CheckIcon } from 'lucide-react';

import { cn, formatChartString } from '@/lib/utils';
import Card from '@/components/ui/card';
import type { SingleSimulationTaxesChartDataPoint } from '@/lib/types/chart-data-points';
import { Subheading } from '@/components/catalyst/heading';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu, DropdownLabel } from '@/components/catalyst/dropdown';

import SingleSimulationTaxesBarChart from '../../charts/single-simulation/single-simulation-taxes-bar-chart';

interface SingleSimulationTaxesBarChartCardProps {
  selectedAge: number;
  rawChartData: SingleSimulationTaxesChartDataPoint[];
  dataView:
    | 'marginalRates'
    | 'effectiveRates'
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxableIncome'
    | 'adjustedGrossIncome'
    | 'investmentIncome'
    | 'retirementDistributions'
    | 'ordinaryIncome'
    | 'capGainsAndDividends'
    | 'earlyWithdrawalPenalties'
    | 'adjustmentsAndDeductions';
  setReferenceLineMode: (mode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates') => void;
  referenceLineMode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates';
  referenceLineModes: readonly ('hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates')[];
  startAge: number;
}

export default function SingleSimulationTaxesBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  setReferenceLineMode: setCurrReferenceLineMode,
  referenceLineMode: currReferenceLineMode,
  referenceLineModes,
  startAge,
}: SingleSimulationTaxesBarChartCardProps) {
  let title;
  switch (dataView) {
    case 'marginalRates':
      title = 'Top Marginal Rates';
      break;
    case 'effectiveRates':
      title = 'Effective Rates';
      break;
    case 'annualAmounts':
      title = 'Annual Taxes';
      break;
    case 'cumulativeAmounts':
      title = 'Cumulative Taxes';
      break;
    case 'taxableIncome':
      title = 'Taxable Income';
      break;
    case 'adjustedGrossIncome':
      title = 'Adjusted Gross Income (AGI)';
      break;
    case 'investmentIncome':
      title = 'Investment Income';
      break;
    case 'retirementDistributions':
      title = 'Retirement Distributions';
      break;
    case 'ordinaryIncome':
      title = 'Ordinary Income';
      break;
    case 'capGainsAndDividends':
      title = 'Capital Gains & Dividends';
      break;
    case 'earlyWithdrawalPenalties':
      title = 'Early Withdrawal Penalties';
      break;
    case 'adjustmentsAndDeductions':
      title = 'Adjustments & Deductions';
      break;
  }

  return (
    <Card className="my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={4}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        {dataView === 'taxableIncome' && (
          <Dropdown>
            <DropdownButton plain aria-label="Open chart view options">
              <EyeIcon data-slot="icon" />
            </DropdownButton>
            <DropdownMenu>
              {referenceLineModes.map((referenceLineMode) => (
                <DropdownItem key={referenceLineMode} onClick={() => setCurrReferenceLineMode(referenceLineMode)}>
                  <CheckIcon data-slot="icon" className={cn({ invisible: currReferenceLineMode !== referenceLineMode })} />
                  <DropdownLabel>{formatChartString(referenceLineMode)}</DropdownLabel>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
      <SingleSimulationTaxesBarChart
        age={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        referenceLineMode={dataView === 'taxableIncome' ? currReferenceLineMode : null}
        startAge={startAge}
      />
    </Card>
  );
}
