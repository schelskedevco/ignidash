"use client";

import { MainArea } from "../components/main-area";
import { SecondaryColumn } from "../components/secondary-column";
import { SectionSelector } from "./components/shared/section-selector";
import { ResultsSections } from "./components/outputs/results-sections";
import { ResultsPageHeader } from "./components/shared/page-headers/results-page-header";
import { YourNumbersSections } from "./components/inputs/your-numbers-sections";
import { YourNumbersPageHeader } from "./components/shared/page-headers/your-numbers-page-header";
import { useState } from "react";

type ActiveSection = "results" | "your-numbers";

export default function QuickPlanPage() {
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("your-numbers");

  return (
    <>
      <MainArea>
        <div className="block xl:hidden">
          <SectionSelector
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          {activeSection === "results" ? (
            <ResultsSections />
          ) : (
            <YourNumbersSections />
          )}
        </div>
        <div className="hidden xl:block">
          <ResultsPageHeader />
          <ResultsSections />
        </div>
      </MainArea>
      <SecondaryColumn>
        <YourNumbersPageHeader />
        <YourNumbersSections />
      </SecondaryColumn>
    </>
  );
}
