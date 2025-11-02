'use client';

import { useState, useCallback, useRef } from 'react';

import type { DisclosureState } from '@/lib/types/disclosure-state';

import IncomesSection from './sections/incomes-section';
import ExpensesSection from './sections/expenses-section';
import PortfolioSection from './sections/portfolio-section';
import ContributionsSection from './sections/contributions-section';

export default function NumbersColumnSections() {
  const incomesButtonRef = useRef<HTMLButtonElement | null>(null);
  const expensesButtonRef = useRef<HTMLButtonElement | null>(null);
  const portfolioButtonRef = useRef<HTMLButtonElement | null>(null);
  const contributionsButtonRef = useRef<HTMLButtonElement | null>(null);

  const [activeDisclosure, setActiveDisclosure] = useState<DisclosureState | null>(null);
  const toggleDisclosure = useCallback(
    (newDisclosure: DisclosureState) => {
      if (activeDisclosure?.open && activeDisclosure.key !== newDisclosure.key) {
        let targetRef = undefined;

        if (newDisclosure.key === 'incomes') {
          targetRef = incomesButtonRef.current;
        } else if (newDisclosure.key === 'expenses') {
          targetRef = expensesButtonRef.current;
        } else if (newDisclosure.key === 'portfolio') {
          targetRef = portfolioButtonRef.current;
        } else if (newDisclosure.key === 'contributions') {
          targetRef = contributionsButtonRef.current;
        }

        activeDisclosure.close(targetRef || undefined);
      }

      setActiveDisclosure({
        ...newDisclosure,
        open: !newDisclosure.open,
      });
    },
    [activeDisclosure]
  );

  return (
    <>
      <IncomesSection toggleDisclosure={toggleDisclosure} disclosureButtonRef={incomesButtonRef} disclosureKey="incomes" />
      <ExpensesSection toggleDisclosure={toggleDisclosure} disclosureButtonRef={expensesButtonRef} disclosureKey="expenses" />
      <PortfolioSection toggleDisclosure={toggleDisclosure} disclosureButtonRef={portfolioButtonRef} disclosureKey="portfolio" />
      <ContributionsSection
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={contributionsButtonRef}
        disclosureKey="contributions"
      />
    </>
  );
}
