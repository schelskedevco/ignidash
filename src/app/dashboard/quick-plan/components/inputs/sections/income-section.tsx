'use client';

import { useState } from 'react';
import { BanknoteArrowUpIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
// import { useIncomesData } from '@/lib/stores/quick-plan-store';

import IncomeDialog from '../dialogs/income-dialog';

export default function IncomeSection() {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  // const incomes = useIncomesData();

  return (
    <>
      <DisclosureSection title="Income" icon={BanknoteArrowUpIcon}>
        {/* <p>{Object.keys(incomes).length > 0 ? JSON.stringify(incomes) : 'No income sources added.'}</p> */}
        <button
          type="button"
          className="focus-outline relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
          onClick={() => setIncomeDialogOpen(true)}
        >
          <BanknoteArrowUpIcon aria-hidden="true" className="text-primary mx-auto size-12" />
          <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Create an income</span>
        </button>
      </DisclosureSection>

      <Dialog size="xl" open={incomeDialogOpen} onClose={setIncomeDialogOpen}>
        <IncomeDialog incomeDialogOpen={incomeDialogOpen} setIncomeDialogOpen={setIncomeDialogOpen} />
      </Dialog>
    </>
  );
}
