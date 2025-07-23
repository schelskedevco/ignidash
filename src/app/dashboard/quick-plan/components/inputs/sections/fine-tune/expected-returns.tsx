'use client';

import { ChartBarIcon } from '@heroicons/react/24/outline';

import NumberInput from '@/components/ui/number-input';
import DisclosureCard from '@/components/ui/disclosure-card';
import {
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
  useStocksRealReturn,
  useBondsRealReturn,
  useCashRealReturn,
} from '@/lib/stores/quick-plan-store';

export default function ExpectedReturns() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  // Get real return rates
  const stocksRealReturn = useStocksRealReturn();
  const bondsRealReturn = useBondsRealReturn();
  const cashRealReturn = useCashRealReturn();

  return (
    <DisclosureCard title="Expected Returns" desc="Expected nominal returns for each asset class." icon={ChartBarIcon}>
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset className="space-y-4">
          <legend className="sr-only">Expected investment returns configuration</legend>
          <NumberInput
            id="stock-return"
            label={
              <div className="flex w-full items-center justify-between">
                <span>Stock Returns (%)</span>
                <span className="text-muted-foreground text-sm/6">{stocksRealReturn.toFixed(1)}% real</span>
              </div>
            }
            value={marketAssumptions.stockReturn}
            onBlur={(value) => updateMarketAssumptions('stockReturn', value)}
            inputMode="decimal"
            placeholder="10%"
            suffix="%"
          />
          <NumberInput
            id="bond-return"
            label={
              <div className="flex w-full items-center justify-between">
                <span>Bond Returns (%)</span>
                <span className="text-muted-foreground text-sm/6">{bondsRealReturn.toFixed(1)}% real</span>
              </div>
            }
            value={marketAssumptions.bondReturn}
            onBlur={(value) => updateMarketAssumptions('bondReturn', value)}
            inputMode="decimal"
            placeholder="5%"
            suffix="%"
          />
          <NumberInput
            id="cash-return"
            label={
              <div className="flex w-full items-center justify-between">
                <span>Cash Returns (%)</span>
                <span className="text-muted-foreground text-sm/6">{cashRealReturn.toFixed(1)}% real</span>
              </div>
            }
            value={marketAssumptions.cashReturn}
            onBlur={(value) => updateMarketAssumptions('cashReturn', value)}
            inputMode="decimal"
            placeholder="3%"
            suffix="%"
          />
        </fieldset>
      </form>
    </DisclosureCard>
  );
}
