'use client';

import { LandmarkIcon } from 'lucide-react';

import { DialogTitle /* DialogBody, DialogActions */ } from '@/components/catalyst/dialog';

interface AccountDialogProps {
  setAccountDialogOpen: (open: boolean) => void;
  selectedAccountID: string | null;
}

export default function AccountDialog({ setAccountDialogOpen, selectedAccountID }: AccountDialogProps) {
  return (
    <DialogTitle>
      <div className="flex items-center gap-4">
        <LandmarkIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
        <span>New Account</span>
      </div>
    </DialogTitle>
  );
}
