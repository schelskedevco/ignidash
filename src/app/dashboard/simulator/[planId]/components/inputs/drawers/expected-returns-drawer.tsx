'use client';

import { ConvexError } from 'convex/values';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';

import { marketAssumptionsToConvex } from '@/lib/utils/convex-to-zod-transformers';
import { type MarketAssumptionsInputs, marketAssumptionsFormSchema } from '@/lib/schemas/inputs/market-assumptions-form-schema';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import ErrorMessageCard from '@/components/ui/error-message-card';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';

function calculateRealReturn(nominalReturn: number, inflationRate: number): number {
  const realReturn = (1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1;
  return realReturn * 100;
}

interface ExpectedReturnsDrawerProps {
  setOpen: (open: boolean) => void;
  marketAssumptions: MarketAssumptionsInputs | null;
}

export default function ExpectedReturnsDrawer({ setOpen, marketAssumptions }: ExpectedReturnsDrawerProps) {
  const planId = useSelectedPlanId();

  const marketAssumptionsDefaultValues = useMemo(
    () =>
      ({
        stockReturn: 10,
        stockYield: 3.5,
        bondReturn: 5,
        bondYield: 4.5,
        cashReturn: 3,
        inflationRate: 3,
      }) as const satisfies MarketAssumptionsInputs,
    []
  );

  const defaultValues = marketAssumptions || marketAssumptionsDefaultValues;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(marketAssumptionsFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (marketAssumptions) reset(marketAssumptions);
  }, [marketAssumptions, reset]);

  const m = useMutation(api.market_assumptions.update);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (data: MarketAssumptionsInputs) => {
    try {
      setSaveError(null);
      posthog.capture('save_expected_returns', { plan_id: planId });
      await m({ marketAssumptions: marketAssumptionsToConvex(data), planId });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof ConvexError ? error.message : 'Failed to save expected returns.');
      console.error('Error saving expected returns: ', error);
    }
  };

  const stockReturn = useWatch({ control, name: 'stockReturn' }) as number;
  const bondReturn = useWatch({ control, name: 'bondReturn' }) as number;
  const cashReturn = useWatch({ control, name: 'cashReturn' }) as number;
  const inflationRate = useWatch({ control, name: 'inflationRate' }) as number;

  const realStockReturn = calculateRealReturn(stockReturn, inflationRate);
  const realBondReturn = calculateRealReturn(bondReturn, inflationRate);
  const realCashReturn = calculateRealReturn(cashReturn, inflationRate);

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Expected Returns" desc="Set expected inflation rate and annual returns for each asset class." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Expected returns details">
              <FieldGroup>
                {saveError && <ErrorMessageCard errorMessage={saveError} />}
                <Field>
                  <Label htmlFor="stockReturn" className="flex w-full items-center justify-between">
                    <span>Stock Return</span>
                    <span className="text-muted-foreground text-sm/6">{realStockReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput
                    name="stockReturn"
                    control={control}
                    id="stockReturn"
                    inputMode="decimal"
                    placeholder="10%"
                    suffix="%"
                    autoFocus
                  />
                  {errors.stockReturn && <ErrorMessage>{errors.stockReturn?.message}</ErrorMessage>}
                  <Description>Expected total annual return for stocks, including reinvested dividends.</Description>
                </Field>
                <Field>
                  <Label htmlFor="stockYield" className="flex w-full items-center justify-between">
                    <span>Dividend Yield</span>
                    <span className="text-muted-foreground text-sm/6">–</span>
                  </Label>
                  <NumberInput name="stockYield" control={control} id="stockYield" inputMode="decimal" placeholder="3.5%" suffix="%" />
                  {errors.stockYield && <ErrorMessage>{errors.stockYield?.message}</ErrorMessage>}
                  <Description>
                    Percentage of stock value received as qualified dividends annually, used to calculate preferentially taxed income.
                  </Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="bondReturn" className="flex w-full items-center justify-between">
                    <span>Bond Return</span>
                    <span className="text-muted-foreground text-sm/6">{realBondReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput id="bondReturn" control={control} name="bondReturn" inputMode="decimal" placeholder="5%" suffix="%" />
                  {errors.bondReturn && <ErrorMessage>{errors.bondReturn?.message}</ErrorMessage>}
                  <Description>Expected total annual return for bonds, including reinvested interest.</Description>
                </Field>
                <Field>
                  <Label htmlFor="bondYield" className="flex w-full items-center justify-between">
                    <span>Bond Yield</span>
                    <span className="text-muted-foreground text-sm/6">–</span>
                  </Label>
                  <NumberInput id="bondYield" control={control} name="bondYield" inputMode="decimal" placeholder="4.5%" suffix="%" />
                  {errors.bondYield && <ErrorMessage>{errors.bondYield?.message}</ErrorMessage>}
                  <Description>
                    Percentage of bond value received as interest annually, used to calculate taxable ordinary income.
                  </Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="cashReturn" className="flex w-full items-center justify-between">
                    <span>Cash Return</span>
                    <span className="text-muted-foreground text-sm/6">{realCashReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput id="cashReturn" control={control} name="cashReturn" inputMode="decimal" placeholder="3%" suffix="%" />
                  {errors.cashReturn && <ErrorMessage>{errors.cashReturn?.message}</ErrorMessage>}
                  <Description>Expected annual interest rate for cash savings and money market accounts.</Description>
                </Field>
                <Field>
                  <Label htmlFor="inflationRate" className="flex w-full items-center justify-between">
                    <span>Inflation Rate</span>
                    <span className="text-muted-foreground text-sm/6">–</span>
                  </Label>
                  <NumberInput id="inflationRate" control={control} name="inflationRate" inputMode="decimal" placeholder="3%" suffix="%" />
                  {errors.inflationRate && <ErrorMessage>{errors.inflationRate?.message}</ErrorMessage>}
                  <Description>Expected annual inflation rate used to calculate real returns.</Description>
                </Field>
                <Divider />
              </FieldGroup>
            </Fieldset>
            <DialogActions>
              <Button outline onClick={() => reset()}>
                Reset
              </Button>
              <Button color="rose" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
