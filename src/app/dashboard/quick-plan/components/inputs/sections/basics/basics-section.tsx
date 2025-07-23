'use client';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import { useBasicsData, useUpdateBasics } from '@/lib/stores/quick-plan-store';

import InvestmentPortfolio from './investment-portfolio';
import IncomeSpendingGrowth from './income-spending-growth';

export default function BasicsSection() {
  const basics = useBasicsData();
  const updateBasics = useUpdateBasics();

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader
        title="Financial Foundation"
        desc="Enter the core numbers needed to estimate your financial independence timeline."
        status="complete"
      />
      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Basic financial information for FIRE calculation</legend>
            <NumberInput
              id="current-age"
              label="Current Age"
              value={basics.currentAge}
              onBlur={(value) => updateBasics('currentAge', value)}
              inputMode="numeric"
              placeholder="28"
              decimalScale={0}
            />
            <NumberInput
              id="annual-income"
              label="Net Annual Income"
              value={basics.annualIncome}
              onBlur={(value) => updateBasics('annualIncome', value)}
              inputMode="decimal"
              placeholder="$85,000"
              prefix="$"
            />
            <NumberInput
              id="annual-expenses"
              label="Annual Spending"
              value={basics.annualExpenses}
              onBlur={(value) => updateBasics('annualExpenses', value)}
              inputMode="decimal"
              placeholder="$50,000"
              prefix="$"
            />
            <NumberInput
              id="invested-assets"
              label="Invested Assets"
              value={basics.investedAssets}
              onBlur={(value) => updateBasics('investedAssets', value)}
              inputMode="decimal"
              placeholder="$75,000"
              prefix="$"
            />
          </fieldset>
        </form>
      </Card>

      <div className="space-y-4">
        <InvestmentPortfolio />
        <IncomeSpendingGrowth />
      </div>
    </SectionContainer>
  );
}
