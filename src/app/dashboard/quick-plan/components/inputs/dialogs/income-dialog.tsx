'use client';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';

interface IncomeDialogProps {
  incomeDialogOpen: boolean;
  setIncomeDialogOpen: (open: boolean) => void;
}

export default function IncomeDialog({ incomeDialogOpen, setIncomeDialogOpen }: IncomeDialogProps) {
  return (
    <>
      <DialogTitle>Income</DialogTitle>
      <DialogBody className="space-y-4"></DialogBody>
      <DialogActions>
        <Button plain onClick={() => setIncomeDialogOpen(false)}>
          Cancel
        </Button>
        <Button color="rose" onClick={() => setIncomeDialogOpen(false)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}
