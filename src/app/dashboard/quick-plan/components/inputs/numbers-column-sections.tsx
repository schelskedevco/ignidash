// 'use client';

// import { useState, useEffect } from 'react';
// import { HourglassIcon /* LandmarkIcon, HandCoinsIcon, BanknoteArrowDownIcon, TrendingUpDownIcon */ } from 'lucide-react';

// import {
//   // useBasicsData,
//   // useUpdateBasics,
//   // useRetirementFundingData,
//   // useUpdateRetirementFunding,
//   // useMarketAssumptionsData,
//   // useUpdateMarketAssumptions,
//   // useStocksRealReturn,
//   // useBondsRealReturn,
//   // useCashRealReturn,
//   // useGrowthRatesData,
//   // useUpdateGrowthRates,
//   // useIncomeRealGrowthRate,
//   // useExpenseRealGrowthRate,
//   // useGoalsData,
//   // useUpdateGoals,
//   // useGoalsTouched,
//   // useUpdateGoalsWithoutTouched,
//   // useAllocationData,
//   // useUpdateAllocation,
//   // useStocksDollarAmount,
//   // useBondsDollarAmount,
//   // useCashDollarAmount,
// } from '@/lib/stores/quick-plan-store';
// import { formatNumber } from '@/lib/utils';
// import DisclosureSection from '@/components/ui/disclosure-section';
// import NumberInput from '@/components/ui/number-input';
// import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
// import { Divider } from '@/components/catalyst/divider';
// import InvalidInputError from '@/components/ui/invalid-input-error';

import TimelineSection from './sections/timeline-section';
import IncomeSection from './sections/income-section';
import ExpensesSection from './sections/expenses-section';
import PortfolioSection from './sections/portfolio-section';
import ContributionsSection from './sections/contributions-section';

// function getSafeWithdrawalRateDescription() {
//   return (
//     <>
//       Annual portfolio withdrawal percentage in retirement. The{' '}
//       <a
//         href="https://www.investopedia.com/terms/f/four-percent-rule.asp"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="text-foreground hover:text-foreground/80 underline"
//       >
//         4% rule
//       </a>{' '}
//       is standard.
//     </>
//   );
// }

export default function NumbersColumnSections() {
  // const marketAssumptions = useMarketAssumptionsData();
  // const updateMarketAssumptions = useUpdateMarketAssumptions();

  // const stocksRealReturn = useStocksRealReturn();
  // const bondsRealReturn = useBondsRealReturn();
  // const cashRealReturn = useCashRealReturn();

  // const goals = useGoalsData();
  // const updateGoals = useUpdateGoals();
  // const goalsAreTouched = useGoalsTouched();
  // const updateGoalsWithoutTouched = useUpdateGoalsWithoutTouched();

  // const growthRates = useGrowthRatesData();
  // const updateGrowthRates = useUpdateGrowthRates();
  // const incomeRealGrowthRate = useIncomeRealGrowthRate();
  // const expenseRealGrowthRate = useExpenseRealGrowthRate();

  // const allocation = useAllocationData();
  // const updateAllocation = useUpdateAllocation();
  // const stocksDollarAmount = useStocksDollarAmount();
  // const bondsDollarAmount = useBondsDollarAmount();
  // const cashDollarAmount = useCashDollarAmount();

  // // Local state for allocation tracking
  // const [localAllocation, setLocalAllocation] = useState({
  //   stockAllocation: allocation.stockAllocation,
  //   bondAllocation: allocation.bondAllocation,
  //   cashAllocation: allocation.cashAllocation,
  // });

  // // Sync store changes to local state
  // useEffect(() => {
  //   setLocalAllocation({
  //     stockAllocation: allocation.stockAllocation,
  //     bondAllocation: allocation.bondAllocation,
  //     cashAllocation: allocation.cashAllocation,
  //   });
  // }, [allocation]);

  // // Error state for allocation validation
  // const [allocationError, setAllocationError] = useState<string | undefined>(undefined);

  // // Handler for allocation field changes
  // const handleAllocationBlur = (field: keyof typeof localAllocation, value: unknown) => {
  //   const updatedAllocation = {
  //     ...localAllocation,
  //     [field]: value,
  //   };

  //   setLocalAllocation(updatedAllocation);

  //   const result = updateAllocation(updatedAllocation);
  //   if (!result.success) {
  //     setAllocationError(result.error);
  //   } else {
  //     setAllocationError(undefined);
  //   }

  //   /*
  //    * HACK: Always return success to prevent field-level errors, relying on section-level validation instead.
  //    * TODO: Properly route field-specific vs form-level errors to appropriate UI locations.
  //    */
  //   return { success: true };
  // };

  return (
    <>
      {/* <DisclosureSection title="Portfolio" icon={LandmarkIcon}>
        <>
          <form onSubmit={(e) => e.preventDefault()}>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label htmlFor="invested-assets">Invested Assets</Label>
                  <NumberInput
                    id="invested-assets"
                    value={basics.investedAssets}
                    onBlur={(value) => updateBasics('investedAssets', value)}
                    inputMode="decimal"
                    placeholder="$75,000"
                    prefix="$"
                  />
                  <Description>Placeholder text.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="stock-allocation" className="flex w-full items-center justify-between">
                    <span>Stocks Allocation</span>
                    <span className="text-muted-foreground text-sm/6">
                      {stocksDollarAmount > 0 ? `$${formatNumber(stocksDollarAmount, 1)}` : '—'}
                    </span>
                  </Label>
                  <NumberInput
                    id="stock-allocation"
                    value={localAllocation.stockAllocation}
                    onBlur={(value) => handleAllocationBlur('stockAllocation', value)}
                    inputMode="decimal"
                    placeholder="70%"
                    suffix="%"
                  />
                  <Description>Placeholder text.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="bond-allocation" className="flex w-full items-center justify-between">
                    <span>Bonds Allocation</span>
                    <span className="text-muted-foreground text-sm/6">
                      {bondsDollarAmount > 0 ? `$${formatNumber(bondsDollarAmount, 1)}` : '—'}
                    </span>
                  </Label>
                  <NumberInput
                    id="bond-allocation"
                    value={localAllocation.bondAllocation}
                    onBlur={(value) => handleAllocationBlur('bondAllocation', value)}
                    inputMode="decimal"
                    placeholder="30%"
                    suffix="%"
                  />
                  <Description>Placeholder text.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="cash-allocation" className="flex w-full items-center justify-between">
                    <span>Cash Allocation</span>
                    <span className="text-muted-foreground text-sm/6">
                      {cashDollarAmount > 0 ? `$${formatNumber(cashDollarAmount, 1)}` : '—'}
                    </span>
                  </Label>
                  <NumberInput
                    id="cash-allocation"
                    value={localAllocation.cashAllocation}
                    onBlur={(value) => handleAllocationBlur('cashAllocation', value)}
                    inputMode="decimal"
                    placeholder="0%"
                    suffix="%"
                  />
                  <Description>Placeholder text.</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
          </form>
          {allocationError && <InvalidInputError title="Asset Allocation Error" desc={allocationError} />}
        </>
      </DisclosureSection> */}
      <TimelineSection />
      <IncomeSection />
      <ExpensesSection />
      <PortfolioSection />
      <ContributionsSection />
      {/* <DisclosureSection title="Cash Flow" icon={HandCoinsIcon}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label htmlFor="annual-income">Annual Income</Label>
                <NumberInput
                  id="annual-income"
                  value={basics.annualIncome}
                  onBlur={(value) => updateBasics('annualIncome', value)}
                  inputMode="decimal"
                  placeholder="$85,000"
                  prefix="$"
                />
                <Description>Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label htmlFor="annual-expenses">Annual Expenses</Label>
                <NumberInput
                  id="annual-expenses"
                  value={basics.annualExpenses}
                  onBlur={(value) => {
                    const result = updateBasics('annualExpenses', value);
                    if (result.success && !goalsAreTouched) {
                      updateGoalsWithoutTouched('retirementExpenses', value);
                    }
                    return result;
                  }}
                  inputMode="decimal"
                  placeholder="$50,000"
                  prefix="$"
                />
                <Description>Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label htmlFor="retirement-income">Retirement Income</Label>
                <NumberInput
                  id="retirement-income"
                  value={retirementFunding.retirementIncome}
                  onBlur={(value) => updateRetirementFunding('retirementIncome', value)}
                  inputMode="decimal"
                  placeholder="$0"
                  prefix="$"
                />
                <Description>Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label htmlFor="retirement-expenses">Retirement Expenses</Label>
                <NumberInput
                  id="retirement-expenses"
                  value={goals.retirementExpenses}
                  onBlur={(value) => updateGoals('retirementExpenses', value)}
                  inputMode="decimal"
                  placeholder="$50,000"
                  prefix="$"
                />
                <Description>Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label htmlFor="income-growth-rate" className="flex w-full items-center justify-between">
                  <span>Income Growth Rate</span>
                  <span className="text-muted-foreground text-sm/6">{incomeRealGrowthRate.toFixed(1)}% real</span>
                </Label>
                <NumberInput
                  id="income-growth-rate"
                  value={growthRates.incomeGrowthRate}
                  onBlur={(value) => updateGrowthRates('incomeGrowthRate', value)}
                  inputMode="decimal"
                  placeholder="3%"
                  suffix="%"
                />
                <Description>Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label htmlFor="expense-growth-rate" className="flex w-full items-center justify-between">
                  <span>Expenses Growth Rate</span>
                  <span className="text-muted-foreground text-sm/6">{expenseRealGrowthRate.toFixed(1)}% real</span>
                </Label>
                <NumberInput
                  id="expense-growth-rate"
                  value={growthRates.expenseGrowthRate}
                  onBlur={(value) => updateGrowthRates('expenseGrowthRate', value)}
                  inputMode="decimal"
                  placeholder="3%"
                  suffix="%"
                />
                <Description>Placeholder text.</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection> */}
      {/* <DisclosureSection title="Withdrawal Strategy" icon={BanknoteArrowDownIcon}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label htmlFor="safe-withdrawal-rate">Safe Withdrawal Rate</Label>
                <NumberInput
                  id="safe-withdrawal-rate"
                  value={retirementFunding.safeWithdrawalRate}
                  onBlur={(value) => updateRetirementFunding('safeWithdrawalRate', value)}
                  inputMode="decimal"
                  placeholder="4%"
                  suffix="%"
                />
                <Description>{getSafeWithdrawalRateDescription()}</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection>
      */}
    </>
  );
}
