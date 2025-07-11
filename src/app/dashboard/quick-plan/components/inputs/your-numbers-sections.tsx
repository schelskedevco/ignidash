"use client";

import { useState } from "react";
import { BasicsSection } from "./sections/basics-section";
import { GoalSection } from "./sections/goal-section";
import { FineTuneSection } from "./sections/fine-tune-section";

export function YourNumbersSections() {
  // Basics inputs state
  const [currentAge, setCurrentAge] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [annualExpenses, setAnnualExpenses] = useState("");
  const [investedAssets, setInvestedAssets] = useState("");

  // Goal inputs state
  const [retirementExpenses, setRetirementExpenses] = useState("");

  // Fine-Tune drawer states
  const [incomeSpendingGrowthOpen, setIncomeSpendingGrowthOpen] =
    useState(false);
  const [investmentPortfolioOpen, setInvestmentPortfolioOpen] = useState(false);
  const [marketAssumptionsOpen, setMarketAssumptionsOpen] = useState(false);
  const [retirementFundingOpen, setRetirementFundingOpen] = useState(false);

  return (
    <>
      <BasicsSection
        currentAge={currentAge}
        setCurrentAge={setCurrentAge}
        annualIncome={annualIncome}
        setAnnualIncome={setAnnualIncome}
        annualExpenses={annualExpenses}
        setAnnualExpenses={setAnnualExpenses}
        investedAssets={investedAssets}
        setInvestedAssets={setInvestedAssets}
      />

      <GoalSection
        retirementExpenses={retirementExpenses}
        setRetirementExpenses={setRetirementExpenses}
        annualExpenses={annualExpenses}
      />

      <FineTuneSection
        incomeSpendingGrowthOpen={incomeSpendingGrowthOpen}
        setIncomeSpendingGrowthOpen={setIncomeSpendingGrowthOpen}
        investmentPortfolioOpen={investmentPortfolioOpen}
        setInvestmentPortfolioOpen={setInvestmentPortfolioOpen}
        marketAssumptionsOpen={marketAssumptionsOpen}
        setMarketAssumptionsOpen={setMarketAssumptionsOpen}
        retirementFundingOpen={retirementFundingOpen}
        setRetirementFundingOpen={setRetirementFundingOpen}
      />
    </>
  );
}
