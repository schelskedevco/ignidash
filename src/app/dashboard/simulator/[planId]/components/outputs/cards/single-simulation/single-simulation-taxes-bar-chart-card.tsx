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
    | 'nonTaxableIncome'
    | 'ordinaryIncome'
    | 'capGainsAndDividends'
    | 'earlyWithdrawalPenalties'
    | 'adjustmentsAndDeductions'
    | 'socialSecurityIncome'
    | 'socialSecurityTaxablePercentage';
  setReferenceLineMode: (mode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates') => void;
  referenceLineMode: 'hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates';
  referenceLineModes: readonly ('hideReferenceLines' | 'marginalCapGainsTaxRates' | 'marginalIncomeTaxRates')[];
  setAgiReferenceLineMode: (mode: 'hideReferenceLines' | 'niitThreshold') => void;
  agiReferenceLineMode: 'hideReferenceLines' | 'niitThreshold';
  agiReferenceLineModes: readonly ('hideReferenceLines' | 'niitThreshold')[];
}

export default function SingleSimulationTaxesBarChartCard({
  selectedAge,
  rawChartData,
  dataView,
  setReferenceLineMode: setCurrReferenceLineMode,
  referenceLineMode: currReferenceLineMode,
  referenceLineModes,
  setAgiReferenceLineMode: setCurrAgiReferenceLineMode,
  agiReferenceLineMode: currAgiReferenceLineMode,
  agiReferenceLineModes,
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
      title = 'Adjusted Gross Income';
      break;
    case 'investmentIncome':
      title = 'Investment Income';
      break;
    case 'retirementDistributions':
      title = 'Retirement Distributions';
      break;
    case 'nonTaxableIncome':
      title = 'Non-Taxable Income';
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
    case 'socialSecurityIncome':
      title = 'Social Security Income';
      break;
    case 'socialSecurityTaxablePercentage':
      title = 'Taxable % of Social Security';
      break;
  }

  return (
    <Card className="relative my-0">
      <div className="mb-4 flex items-center justify-between">
        <Subheading level={3}>
          <span className="mr-2">{title}</span>
          <span className="text-muted-foreground hidden sm:inline">Age {selectedAge}</span>
        </Subheading>
        {dataView === 'taxableIncome' && (
          <Dropdown>
            <DropdownButton plain aria-label="Open chart view options" className="absolute top-3 right-3 sm:top-5 sm:right-5">
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
        {dataView === 'adjustedGrossIncome' && (
          <Dropdown>
            <DropdownButton plain aria-label="Open chart view options" className="absolute top-3 right-3 sm:top-5 sm:right-5">
              <EyeIcon data-slot="icon" />
            </DropdownButton>
            <DropdownMenu>
              {agiReferenceLineModes.map((agiReferenceLineMode) => (
                <DropdownItem key={agiReferenceLineMode} onClick={() => setCurrAgiReferenceLineMode(agiReferenceLineMode)}>
                  <CheckIcon data-slot="icon" className={cn({ invisible: currAgiReferenceLineMode !== agiReferenceLineMode })} />
                  <DropdownLabel>{formatChartString(agiReferenceLineMode)}</DropdownLabel>
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
        agiReferenceLineMode={dataView === 'adjustedGrossIncome' ? currAgiReferenceLineMode : null}
      />
    </Card>
  );
}
