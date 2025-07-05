"use client";

import { Input } from "@/components/catalyst/input";

export function CoreInputs() {
  const calcFields = [
    { id: "current-age", label: "Current Age", placeholder: "28" },
    { id: "annual-income", label: "Annual Income", placeholder: "$85,000" },
    { id: "annual-expenses", label: "Annual Expenses", placeholder: "$50,000" },
    { id: "invested-assets", label: "Invested Assets", placeholder: "$75,000" },
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      {calcFields.map((calcField) => (
        <div key={calcField.id}>
          <label
            htmlFor={calcField.id}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {calcField.label}
          </label>
          <Input
            id={calcField.id}
            type="number"
            placeholder={calcField.placeholder}
          />
        </div>
      ))}
    </form>
  );
}
