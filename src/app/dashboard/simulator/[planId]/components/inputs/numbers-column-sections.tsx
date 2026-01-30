'use client';

import { useState, useCallback, useRef } from 'react';

import type { DisclosureState } from '@/lib/types/disclosure-state';

import IncomesSection from './sections/incomes-section';
import ExpensesSection from './sections/expenses-section';
import NetWorthSection from './sections/net-worth-section';
import ContributionOrderSection from './sections/contribution-order-section';

export default function NumbersColumnSections() {
  const incomesButtonRef = useRef<HTMLButtonElement | null>(null);
  const expensesButtonRef = useRef<HTMLButtonElement | null>(null);
  const netWorthButtonRef = useRef<HTMLButtonElement | null>(null);
  const contributionOrderButtonRef = useRef<HTMLButtonElement | null>(null);

  const [activeDisclosure, setActiveDisclosure] = useState<DisclosureState | null>(null);
  const toggleDisclosure = useCallback(
    (newDisclosure: DisclosureState) => {
      if (activeDisclosure?.open && activeDisclosure.key !== newDisclosure.key) {
        let targetRef = undefined;

        if (newDisclosure.key === 'incomes') {
          targetRef = incomesButtonRef.current;
        } else if (newDisclosure.key === 'expenses') {
          targetRef = expensesButtonRef.current;
        } else if (newDisclosure.key === 'netWorth') {
          targetRef = netWorthButtonRef.current;
        } else if (newDisclosure.key === 'contributionOrder') {
          targetRef = contributionOrderButtonRef.current;
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
      <NetWorthSection toggleDisclosure={toggleDisclosure} disclosureButtonRef={netWorthButtonRef} disclosureKey="netWorth" />
      <ContributionOrderSection
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={contributionOrderButtonRef}
        disclosureKey="contributionOrder"
      />
    </>
  );
}
