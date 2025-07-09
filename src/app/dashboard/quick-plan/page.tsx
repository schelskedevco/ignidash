"use client";

import { MainArea } from "../components/main-area";
import { SecondaryColumn } from "../components/secondary-column";
import { SectionSelector } from "./components/section-selector";
import { ResultsContent } from "./components/results-content";
import { ResultsHeader } from "./components/results-header";
import { YourNumbersContent } from "./components/your-numbers-content";
import { YourNumbersHeader } from "./components/your-numbers-header";
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
            <ResultsContent />
          ) : (
            <YourNumbersContent />
          )}
        </div>
        <div className="hidden xl:block">
          <ResultsHeader />
          <ResultsContent />
        </div>
      </MainArea>
      <SecondaryColumn>
        <YourNumbersHeader />
        <YourNumbersContent />
      </SecondaryColumn>
    </>
  );
}
