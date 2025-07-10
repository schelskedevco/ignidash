"use client";

import { Card } from "@/components/card";
import { FoundationInputs } from "./foundation-inputs";
import { CoastFIRE, BaristaFIRE } from "./fire-path-options";
import { RightChevronButton } from "@/components/right-chevron-button";
import { useState } from "react";
import Drawer from "@/components/drawer";
import { GrowthAllocation } from "./growth-allocation";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

export function YourNumbersContent() {
  const [growthAllocationOpen, setGrowthAllocationOpen] = useState(false);

  // Foundation inputs state
  const [currentAge, setCurrentAge] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [annualExpenses, setAnnualExpenses] = useState("");
  const [investedAssets, setInvestedAssets] = useState("");

  return (
    <>
      <div className="border-foreground/10 mb-5 border-b pb-5">
        <div className="ml-2">
          <h4 className="text-base font-semibold">The Foundation</h4>
          <p className="text-muted-foreground mt-2 text-sm">
            The core numbers needed to estimate your financial independence
            timeline.
          </p>
        </div>

        <Card>
          <FoundationInputs
            currentAge={currentAge}
            setCurrentAge={setCurrentAge}
            annualIncome={annualIncome}
            setAnnualIncome={setAnnualIncome}
            annualExpenses={annualExpenses}
            setAnnualExpenses={setAnnualExpenses}
            investedAssets={investedAssets}
            setInvestedAssets={setInvestedAssets}
          />
        </Card>

        <RightChevronButton
          title="Growth & Allocation"
          leftIcon={AdjustmentsHorizontalIcon}
          onClick={() => setGrowthAllocationOpen(true)}
        />
      </div>
      <div className="border-foreground/10 mb-5 border-b pb-5">
        <div className="ml-2">
          <h4 className="text-base font-semibold">Alternative Strategies</h4>
          <p className="text-muted-foreground mt-2 text-sm">
            Full retirement isn&apos;t your only option. Explore proven
            strategies for earlier freedom.
          </p>
        </div>
        <Card>
          <CoastFIRE />
        </Card>
        <Card>
          <BaristaFIRE />
        </Card>
      </div>
      <Drawer
        open={growthAllocationOpen}
        setOpen={setGrowthAllocationOpen}
        title="Growth & Allocation"
        desc="Fine-tune how your Foundation numbers are used in projections."
      >
        <GrowthAllocation annualExpenses={annualExpenses} />
      </Drawer>
    </>
  );
}
