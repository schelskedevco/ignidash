'use client';

import { useState, useEffect } from 'react';
import { HourglassIcon, LandmarkIcon, HandCoinsIcon, BanknoteArrowDownIcon, TrendingUpDownIcon } from 'lucide-react';

import {
  useBasicsData,
  useUpdateBasics,
  useRetirementFundingData,
  useUpdateRetirementFunding,
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
  useStocksRealReturn,
  useBondsRealReturn,
  useCashRealReturn,
  useGrowthRatesData,
  useUpdateGrowthRates,
  useIncomeRealGrowthRate,
  useExpenseRealGrowthRate,
  useGoalsData,
  useUpdateGoals,
  useGoalsTouched,
  useUpdateGoalsWithoutTouched,
  useAllocationData,
  useUpdateAllocation,
  useStocksDollarAmount,
  useBondsDollarAmount,
  useCashDollarAmount,
} from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import DisclosureSection from '@/components/ui/disclosure-section';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';
import InvalidInputError from '@/components/ui/invalid-input-error';

// import BasicsSection from './sections/basics/section';
// import GoalSection from './sections/retirement-goal/section';
// import FineTuneSection from './sections/fine-tune/section';

function getSafeWithdrawalRateDescription() {
  return (
    <>
      Annual portfolio withdrawal percentage in retirement. The{' '}
      <a
        href="https://www.investopedia.com/terms/f/four-percent-rule.asp"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        4% rule
      </a>{' '}
      is standard.
    </>
  );
}

export default function NumbersColumnSections() {
  const basics = useBasicsData();
  const updateBasics = useUpdateBasics();

  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  const stocksRealReturn = useStocksRealReturn();
  const bondsRealReturn = useBondsRealReturn();
  const cashRealReturn = useCashRealReturn();

  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();
  const goalsAreTouched = useGoalsTouched();
  const updateGoalsWithoutTouched = useUpdateGoalsWithoutTouched();

  const growthRates = useGrowthRatesData();
  const updateGrowthRates = useUpdateGrowthRates();
  const incomeRealGrowthRate = useIncomeRealGrowthRate();
  const expenseRealGrowthRate = useExpenseRealGrowthRate();

  const allocation = useAllocationData();
  const updateAllocation = useUpdateAllocation();
  const stocksDollarAmount = useStocksDollarAmount();
  const bondsDollarAmount = useBondsDollarAmount();
  const cashDollarAmount = useCashDollarAmount();

  // Local state for allocation tracking
  const [localAllocation, setLocalAllocation] = useState({
    stockAllocation: allocation.stockAllocation,
    bondAllocation: allocation.bondAllocation,
    cashAllocation: allocation.cashAllocation,
  });

  // Sync store changes to local state
  useEffect(() => {
    setLocalAllocation({
      stockAllocation: allocation.stockAllocation,
      bondAllocation: allocation.bondAllocation,
      cashAllocation: allocation.cashAllocation,
    });
  }, [allocation]);

  // Error state for allocation validation
  const [allocationError, setAllocationError] = useState<string | undefined>(undefined);

  // Handler for allocation field changes
  const handleAllocationBlur = (field: keyof typeof localAllocation, value: unknown) => {
    const updatedAllocation = {
      ...localAllocation,
      [field]: value,
    };

    setLocalAllocation(updatedAllocation);

    const result = updateAllocation(updatedAllocation);
    if (!result.success) {
      setAllocationError(result.error);
    } else {
      setAllocationError(undefined);
    }

    /*
     * HACK: Always return success to prevent field-level errors, relying on section-level validation instead.
     * TODO: Properly route field-specific vs form-level errors to appropriate UI locations.
     */
    return { success: true };
  };

  return (
    <>
      <DisclosureSection title="Duration" icon={HourglassIcon} defaultOpen>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label>Age</Label>
                <NumberInput
                  id="current-age"
                  value={basics.currentAge}
                  onBlur={(value) => updateBasics('currentAge', value)}
                  inputMode="numeric"
                  placeholder="28"
                  decimalScale={0}
                />
                <Description className="mt-2">The age your simulation will start at.</Description>
              </Field>
              <Divider />
              <Field>
                <Label>Life Expectancy</Label>
                <NumberInput
                  id="life-expectancy"
                  value={retirementFunding.lifeExpectancy}
                  onBlur={(value) => updateRetirementFunding('lifeExpectancy', value)}
                  inputMode="numeric"
                  placeholder="85"
                  decimalScale={0}
                />
                <Description className="mt-2">The age your simulation will end at.</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection>
      <DisclosureSection title="Portfolio" icon={LandmarkIcon}>
        <>
          <form onSubmit={(e) => e.preventDefault()}>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Invested Assets</Label>
                  <NumberInput
                    id="invested-assets"
                    value={basics.investedAssets}
                    onBlur={(value) => updateBasics('investedAssets', value)}
                    inputMode="decimal"
                    placeholder="$75,000"
                    prefix="$"
                  />
                  <Description className="mt-2">Placeholder text.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label className="flex w-full items-center justify-between">
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
                  <Description className="mt-2">Placeholder text.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label className="flex w-full items-center justify-between">
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
                  <Description className="mt-2">Placeholder text.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label className="flex w-full items-center justify-between">
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
                  <Description className="mt-2">Placeholder text.</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
          </form>
          {allocationError && <InvalidInputError title="Asset Allocation Error" desc={allocationError} />}
        </>
      </DisclosureSection>
      <DisclosureSection title="Cash Flow" icon={HandCoinsIcon}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label>Annual Income</Label>
                <NumberInput
                  id="annual-income"
                  value={basics.annualIncome}
                  onBlur={(value) => updateBasics('annualIncome', value)}
                  inputMode="decimal"
                  placeholder="$85,000"
                  prefix="$"
                />
                <Description className="mt-2">Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label>Annual Expenses</Label>
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
                <Description className="mt-2">Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label>Retirement Income</Label>
                <NumberInput
                  id="retirement-income"
                  value={retirementFunding.retirementIncome}
                  onBlur={(value) => updateRetirementFunding('retirementIncome', value)}
                  inputMode="decimal"
                  placeholder="$0"
                  prefix="$"
                />
                <Description className="mt-2">Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label>Retirement Expenses</Label>
                <NumberInput
                  id="retirement-expenses"
                  value={goals.retirementExpenses}
                  onBlur={(value) => updateGoals('retirementExpenses', value)}
                  inputMode="decimal"
                  placeholder="$50,000"
                  prefix="$"
                />
                <Description className="mt-2">Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label className="flex w-full items-center justify-between">
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
                <Description className="mt-2">Placeholder text.</Description>
              </Field>
              <Divider />
              <Field>
                <Label className="flex w-full items-center justify-between">
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
                <Description className="mt-2">Placeholder text.</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection>
      <DisclosureSection title="Withdrawal Strategy" icon={BanknoteArrowDownIcon}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label>Safe Withdrawal Rate</Label>
                <NumberInput
                  id="safe-withdrawal-rate"
                  value={retirementFunding.safeWithdrawalRate}
                  onBlur={(value) => updateRetirementFunding('safeWithdrawalRate', value)}
                  inputMode="decimal"
                  placeholder="4%"
                  suffix="%"
                />
                <Description className="mt-2">{getSafeWithdrawalRateDescription()}</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection>
      <DisclosureSection title="Expected Returns" icon={TrendingUpDownIcon}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label className="flex w-full items-center justify-between">
                  <span>Stocks</span>
                  <span className="text-muted-foreground text-sm/6">{stocksRealReturn.toFixed(1)}% real</span>
                </Label>
                <NumberInput
                  id="stock-return"
                  value={marketAssumptions.stockReturn}
                  onBlur={(value) => updateMarketAssumptions('stockReturn', value)}
                  inputMode="decimal"
                  placeholder="10%"
                  suffix="%"
                />
                <Description className="mt-2">Expected annual return for stocks and other volatile investments.</Description>
              </Field>
              <Divider />
              <Field>
                <Label className="flex w-full items-center justify-between">
                  <span>Bonds</span>
                  <span className="text-muted-foreground text-sm/6">{bondsRealReturn.toFixed(1)}% real</span>
                </Label>
                <NumberInput
                  id="bond-return"
                  value={marketAssumptions.bondReturn}
                  onBlur={(value) => updateMarketAssumptions('bondReturn', value)}
                  inputMode="decimal"
                  placeholder="5%"
                  suffix="%"
                />
                <Description className="mt-2">Expected annual return for bonds.</Description>
              </Field>
              <Divider />
              <Field>
                <Label className="flex w-full items-center justify-between">
                  <span>Cash</span>
                  <span className="text-muted-foreground text-sm/6">{cashRealReturn.toFixed(1)}% real</span>
                </Label>
                <NumberInput
                  id="cash-return"
                  value={marketAssumptions.cashReturn}
                  onBlur={(value) => updateMarketAssumptions('cashReturn', value)}
                  inputMode="decimal"
                  placeholder="3%"
                  suffix="%"
                />
                <Description className="mt-2">Expected annual interest rate for cash savings and money market accounts.</Description>
              </Field>
              <Divider />
              <Field>
                <Label className="flex w-full items-center justify-between">
                  <span>Inflation Rate</span>
                  <span className="text-muted-foreground text-sm/6">—</span>
                </Label>
                <NumberInput
                  id="inflation-rate"
                  value={marketAssumptions.inflationRate}
                  onBlur={(value) => updateMarketAssumptions('inflationRate', value)}
                  inputMode="decimal"
                  placeholder="3%"
                  suffix="%"
                />
                <Description className="mt-2">Expected annual inflation rate, used to calculate real returns.</Description>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DisclosureSection>
      {/* <BasicsSection />
      <GoalSection />
      <FineTuneSection /> */}
    </>
  );
}
