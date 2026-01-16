'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { CircleQuestionMarkIcon } from 'lucide-react';

import { DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';

interface OnboardingDialogProps {
  onClose: () => void;
}

export default function OnboardingDialog({ onClose }: OnboardingDialogProps) {
  return (
    <>
      <DialogTitle onClose={onClose}>
        <div className="flex items-center gap-4">
          <FireIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>Welcome to Ignidash!</span>
        </div>
      </DialogTitle>
      <DialogDescription>
        This onboarding dialog will help you get started, but feel free to skip it if you&apos;d like to explore things on your own.
      </DialogDescription>

      <DialogBody></DialogBody>

      <DialogActions>
        <Button plain href="/help" className="hidden sm:inline-flex" target="_blank" rel="noopener noreferrer">
          <CircleQuestionMarkIcon data-slot="icon" />
          Help
        </Button>
        <Button color="rose" onClick={onClose}>
          OK, let&apos;s go!
        </Button>
      </DialogActions>
    </>
  );
}
