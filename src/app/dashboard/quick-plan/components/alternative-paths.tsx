"use client";

import { Input } from "@/components/catalyst/input";
import { DisclosureSection } from "@/components/disclosure-section";

export function AlternativePaths() {
  return (
    <DisclosureSection
      title="Coast FIRE"
      desc="Front-load savings, then work just enough to cover living expenses."
    >
      <form onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="target-retirement-age"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Target Retirement Age
          </label>
          <Input id="target-retirement-age" type="number" placeholder="65" />
        </div>
      </form>
    </DisclosureSection>
  );
}
