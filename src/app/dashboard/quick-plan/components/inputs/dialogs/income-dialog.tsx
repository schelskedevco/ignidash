'use client';

import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import NumberInput from '@/components/ui/number-input';
import { Field, FieldGroup, Fieldset, Label /* Description */ } from '@/components/catalyst/fieldset';
// import { Divider } from '@/components/catalyst/divider';
import { Select } from '@/components/catalyst/select';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';

interface IncomeDialogProps {
  incomeDialogOpen: boolean;
  setIncomeDialogOpen: (open: boolean) => void;
}

export default function IncomeDialog({ incomeDialogOpen, setIncomeDialogOpen }: IncomeDialogProps) {
  return (
    <>
      <DialogTitle>Income</DialogTitle>
      <DialogBody className="space-y-4">
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset aria-label="Income details">
            <FieldGroup>
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="My Salary" autoComplete="off" inputMode="text" />
              </Field>
              <Field>
                <Label htmlFor="amount">Amount</Label>
                <NumberInput
                  id="amount"
                  value={85000}
                  onBlur={(value) => {
                    return { success: true };
                  }}
                  inputMode="decimal"
                  placeholder="$85,000"
                  prefix="$"
                />
              </Field>
              <Field>
                <Label htmlFor="growth-rate" className="flex w-full items-center justify-between">
                  <span>Rate of Change</span>
                  <span className="text-muted-foreground text-sm/6">{Number(3).toFixed(1)}% real</span>
                </Label>
                <NumberInput
                  id="growth-rate"
                  value={3}
                  onBlur={(value) => {
                    return { success: true };
                  }}
                  inputMode="decimal"
                  placeholder="3%"
                  suffix="%"
                />
              </Field>
              <Field>
                <Label htmlFor="frequency">Frequency</Label>
                <Select id="frequency" name="frequency">
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </Select>
              </Field>
            </FieldGroup>
          </Fieldset>
        </form>
      </DialogBody>
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
