"use client";

import { NumberField } from "@/components/number-field";

interface BasicsInputsProps {
  currentAge: string;
  setCurrentAge: (value: string) => void;
  annualIncome: string;
  setAnnualIncome: (value: string) => void;
  annualExpenses: string;
  setAnnualExpenses: (value: string) => void;
  investedAssets: string;
  setInvestedAssets: (value: string) => void;
}

export function BasicsInputs({
  currentAge,
  setCurrentAge,
  annualIncome,
  setAnnualIncome,
  annualExpenses,
  setAnnualExpenses,
  investedAssets,
  setInvestedAssets,
}: BasicsInputsProps) {
  const calcFields = [
    {
      id: "current-age",
      label: "Current Age",
      placeholder: "28",
      value: currentAge,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setCurrentAge(e.target.value),
    },
    {
      id: "annual-income",
      label: "Net Annual Income",
      placeholder: "$85,000",
      value: annualIncome,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setAnnualIncome(e.target.value),
    },
    {
      id: "annual-expenses",
      label: "Annual Expenses",
      placeholder: "$50,000",
      value: annualExpenses,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setAnnualExpenses(e.target.value),
    },
    {
      id: "invested-assets",
      label: "Invested Assets",
      placeholder: "$75,000",
      value: investedAssets,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setInvestedAssets(e.target.value),
    },
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      {calcFields.map((calcField) => (
        <NumberField
          key={calcField.id}
          id={calcField.id}
          label={calcField.label}
          value={calcField.value}
          onChange={calcField.onChange}
          placeholder={calcField.placeholder}
        />
      ))}
    </form>
  );
}
