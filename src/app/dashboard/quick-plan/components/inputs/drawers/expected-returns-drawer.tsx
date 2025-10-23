'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
  useStocksRealReturn,
  useBondsRealReturn,
  useCashRealReturn,
} from '@/lib/stores/quick-plan-store';
import { type MarketAssumptionsInputs, marketAssumptionsSchema } from '@/lib/schemas/market-assumptions-schema';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';
import { Button } from '@/components/catalyst/button';
import { DialogActions } from '@/components/catalyst/dialog';

interface ExpectedReturnsDrawerProps {
  setOpen: (open: boolean) => void;
}

export default function ExpectedReturnsDrawer({ setOpen }: ExpectedReturnsDrawerProps) {
  const marketAssumptions = useMarketAssumptionsData();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(marketAssumptionsSchema),
    defaultValues: marketAssumptions,
  });

  const updateMarketAssumptions = useUpdateMarketAssumptions();
  const onSubmit = (data: MarketAssumptionsInputs) => {
    updateMarketAssumptions({ ...data });
    setOpen(false);
  };

  const stocksRealReturn = useStocksRealReturn();
  const bondsRealReturn = useBondsRealReturn();
  const cashRealReturn = useCashRealReturn();

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Expected Returns" desc="Set expected inflation rate and annual returns for each asset class." />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Fieldset aria-label="Expected Returns">
              <FieldGroup>
                <Field>
                  <Label htmlFor="stockReturn" className="flex w-full items-center justify-between">
                    <span>Stock Return</span>
                    <span className="text-muted-foreground text-sm/6">{stocksRealReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput name="stockReturn" control={control} id="stockReturn" inputMode="decimal" placeholder="10%" suffix="%" />
                  {errors.stockReturn && <ErrorMessage>{errors.stockReturn?.message}</ErrorMessage>}
                  <Description>Expected annual return for stocks and other volatile investments.</Description>
                </Field>
                <Field>
                  <Label htmlFor="stockYield" className="flex w-full items-center justify-between">
                    <span>Dividend Yield</span>
                    <span className="text-muted-foreground text-sm/6">–</span>
                  </Label>
                  <NumberInput name="stockYield" control={control} id="stockYield" inputMode="decimal" placeholder="3.5%" suffix="%" />
                  {errors.stockYield && <ErrorMessage>{errors.stockYield?.message}</ErrorMessage>}
                  <Description>Percentage of stock value paid out as dividends annually, used to calculate taxable income.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="bondReturn" className="flex w-full items-center justify-between">
                    <span>Bond Return</span>
                    <span className="text-muted-foreground text-sm/6">{bondsRealReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput id="bondReturn" control={control} name="bondReturn" inputMode="decimal" placeholder="5%" suffix="%" />
                  {errors.bondReturn && <ErrorMessage>{errors.bondReturn?.message}</ErrorMessage>}
                  <Description>Expected annual return for bonds.</Description>
                </Field>
                <Field>
                  <Label htmlFor="bondYield" className="flex w-full items-center justify-between">
                    <span>Bond Yield</span>
                    <span className="text-muted-foreground text-sm/6">–</span>
                  </Label>
                  <NumberInput id="bondYield" control={control} name="bondYield" inputMode="decimal" placeholder="4.5%" suffix="%" />
                  {errors.bondYield && <ErrorMessage>{errors.bondYield?.message}</ErrorMessage>}
                  <Description>Percentage of bond value paid out as interest annually, used to calculate taxable income.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="cashReturn" className="flex w-full items-center justify-between">
                    <span>Cash Return</span>
                    <span className="text-muted-foreground text-sm/6">{cashRealReturn.toFixed(1)}% real</span>
                  </Label>
                  <NumberInput id="cashReturn" control={control} name="cashReturn" inputMode="decimal" placeholder="3%" suffix="%" />
                  {errors.cashReturn && <ErrorMessage>{errors.cashReturn?.message}</ErrorMessage>}
                  <Description>Expected annual interest rate for cash savings and money market accounts.</Description>
                </Field>
                <Divider />
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
              <Button color="rose" type="submit">
                Save
              </Button>
            </DialogActions>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
