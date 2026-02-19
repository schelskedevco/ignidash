import { LinkIcon } from 'lucide-react';

import { Field, Label } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';

interface SyncWithNetWorthTrackerSelectProps {
  fieldId: string;
  options: { id: string; label: string }[];
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export default function SyncWithNetWorthTrackerSelect({
  fieldId,
  options,
  value,
  onChange,
  className,
}: SyncWithNetWorthTrackerSelectProps) {
  if (options.length === 0) return null;

  return (
    <Field className={className}>
      <Label htmlFor={fieldId} className="flex items-center gap-1.5">
        <LinkIcon className="text-muted-foreground hidden size-3.5 shrink-0 sm:inline-block" />
        <span className="whitespace-nowrap">Sync w/ NW Tracker</span>
      </Label>
      <Select id={fieldId} name={fieldId} value={value ?? ''} onChange={onChange}>
        <option value="">None</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
