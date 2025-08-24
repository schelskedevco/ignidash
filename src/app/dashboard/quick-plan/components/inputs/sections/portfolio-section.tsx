'use client';

import { useState } from 'react';
import { LandmarkIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';

import AccountDialog from '../dialogs/account-dialog';

export default function PortfolioSection() {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccountID, setSelectedAccountID] = useState<string | null>(null);

  return (
    <>
      <DisclosureSection title="Portfolio" icon={LandmarkIcon}>
        <button
          type="button"
          className="focus-outline relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
          onClick={() => setAccountDialogOpen(true)}
        >
          <LandmarkIcon aria-hidden="true" className="text-primary mx-auto size-12" />
          <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add an account</span>
        </button>
        <Dialog
          size="xl"
          open={accountDialogOpen}
          onClose={() => {
            setSelectedAccountID(null);
            setAccountDialogOpen(false);
          }}
        >
          <AccountDialog setAccountDialogOpen={setAccountDialogOpen} selectedAccountID={selectedAccountID} />
        </Dialog>
      </DisclosureSection>
    </>
  );
}
