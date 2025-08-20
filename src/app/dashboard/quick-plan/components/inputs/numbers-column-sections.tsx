'use client';

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
} from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';

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
        <p>I am portfolio.</p>
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
                  <span>Investments</span>
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
