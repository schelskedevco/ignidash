"use client";

import { DrawerTriggerButton } from "@/components/ui/drawer-trigger-button";
import Drawer from "@/components/ui/drawer";
import { IncomeSpendingDrawer } from "../drawers/income-spending-drawer";
import { InvestmentPortfolioDrawer } from "../drawers/investment-portfolio-drawer";
import { MarketAssumptionsDrawer } from "../drawers/market-assumptions-drawer";
import { RetirementFundingDrawer } from "../drawers/retirement-funding-drawer";
import {
  ArrowTrendingUpIcon,
  ChartPieIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { SectionHeader } from "@/components/layout/section-header";

interface FineTuneSectionProps {
  incomeSpendingGrowthOpen: boolean;
  setIncomeSpendingGrowthOpen: (open: boolean) => void;
  investmentPortfolioOpen: boolean;
  setInvestmentPortfolioOpen: (open: boolean) => void;
  marketAssumptionsOpen: boolean;
  setMarketAssumptionsOpen: (open: boolean) => void;
  retirementFundingOpen: boolean;
  setRetirementFundingOpen: (open: boolean) => void;
}

export function FineTuneSection({
  incomeSpendingGrowthOpen,
  setIncomeSpendingGrowthOpen,
  investmentPortfolioOpen,
  setInvestmentPortfolioOpen,
  marketAssumptionsOpen,
  setMarketAssumptionsOpen,
  retirementFundingOpen,
  setRetirementFundingOpen,
}: FineTuneSectionProps) {
  return (
    <>
      <div className="border-foreground/10 mb-5 space-y-4 border-b pb-5">
        <SectionHeader
          headline="Fine-Tuning"
          desc="Adjust advanced settings to refine your projections and assumptions."
        />

        <DrawerTriggerButton
          title="Income & Spending Growth"
          desc="Set expected growth rates for income and expenses over time."
          leftIcon={ArrowTrendingUpIcon}
          onClick={() => setIncomeSpendingGrowthOpen(true)}
        />

        <DrawerTriggerButton
          title="Investment Portfolio"
          desc="Configure asset allocation across stocks, bonds, and cash."
          leftIcon={ChartPieIcon}
          onClick={() => setInvestmentPortfolioOpen(true)}
        />

        <DrawerTriggerButton
          title="Market & Economic Assumptions"
          desc="Set inflation rate and how to project investment returns by asset class."
          leftIcon={ChartBarIcon}
          onClick={() => setMarketAssumptionsOpen(true)}
        />

        <DrawerTriggerButton
          title="Retirement Funding & Duration"
          desc="Configure withdrawal strategy, retirement income sources, and life expectancy."
          leftIcon={ClockIcon}
          onClick={() => setRetirementFundingOpen(true)}
        />
      </div>

      {/* Fine-Tune drawers */}
      <Drawer
        open={incomeSpendingGrowthOpen}
        setOpen={setIncomeSpendingGrowthOpen}
        title="Income & Spending Growth"
      >
        <IncomeSpendingDrawer />
      </Drawer>

      <Drawer
        open={investmentPortfolioOpen}
        setOpen={setInvestmentPortfolioOpen}
        title="Investment Portfolio"
      >
        <InvestmentPortfolioDrawer />
      </Drawer>

      <Drawer
        open={marketAssumptionsOpen}
        setOpen={setMarketAssumptionsOpen}
        title="Market & Economic Assumptions"
      >
        <MarketAssumptionsDrawer />
      </Drawer>

      <Drawer
        open={retirementFundingOpen}
        setOpen={setRetirementFundingOpen}
        title="Retirement Funding & Duration"
      >
        <RetirementFundingDrawer />
      </Drawer>
    </>
  );
}
