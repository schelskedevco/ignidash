'use client';

import {
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
  useStocksRealReturn,
  useBondsRealReturn,
  useCashRealReturn,
} from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label, Description } from '@/components/catalyst/fieldset';
import { Divider } from '@/components/catalyst/divider';

export default function MarketAssumptionsDrawer() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  const stocksRealReturn = useStocksRealReturn();
  const bondsRealReturn = useBondsRealReturn();
  const cashRealReturn = useCashRealReturn();

  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Expected Returns" desc="Set expected inflation rate and annual returns for each asset class." />
        <Card>
          <form onSubmit={(e) => e.preventDefault()}>
            <Fieldset aria-label="Expected Returns">
              <FieldGroup>
                <Field>
                  <Label htmlFor="stock-return" className="flex w-full items-center justify-between">
                    <span>Stock Return</span>
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
                  <Description>Expected annual return for stocks and other volatile investments.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="bond-return" className="flex w-full items-center justify-between">
                    <span>Bond Return</span>
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
                  <Description>Expected annual return for bonds.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="cash-return" className="flex w-full items-center justify-between">
                    <span>Cash Return</span>
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
                  <Description>Expected annual interest rate for cash savings and money market accounts.</Description>
                </Field>
                <Divider />
                <Field>
                  <Label htmlFor="inflation-rate" className="flex w-full items-center justify-between">
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
                  <Description>Expected annual inflation rate, used to calculate real returns.</Description>
                </Field>
              </FieldGroup>
            </Fieldset>
          </form>
        </Card>
      </SectionContainer>
    </>
  );
}
