'use client';

import { LandmarkIcon } from 'lucide-react';
// import { useState, useCallback, useEffect, useRef, MutableRefObject } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
// import { MinusIcon, PlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm, useWatch, Controller } from 'react-hook-form';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
// import NumberInputV2 from '@/components/ui/number-input-v2';
import { Fieldset /* Field, Label, ErrorMessage  Description */ } from '@/components/catalyst/fieldset';
// import { Combobox, ComboboxLabel, ComboboxOption } from '@/components/catalyst/combobox';
// import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
// import { Input } from '@/components/catalyst/input';

interface AccountDialogProps {
  setAccountDialogOpen: (open: boolean) => void;
  selectedAccountID: string | null;
}

export default function AccountDialog({ setAccountDialogOpen, selectedAccountID }: AccountDialogProps) {
  return (
    <>
      <DialogTitle>
        <div className="flex items-center gap-4">
          <LandmarkIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span>New Account</span>
        </div>
      </DialogTitle>
      <form onSubmit={() => {}}>
        <Fieldset aria-label="Account details">
          <DialogBody data-slot="control" className="space-y-4">
            <p>Placeholder Text.</p>
          </DialogBody>
        </Fieldset>
        <DialogActions>
          <Button plain onClick={() => {}}>
            Cancel
          </Button>
          <Button color="rose" type="submit">
            Save
          </Button>
        </DialogActions>
      </form>
    </>
  );
}
