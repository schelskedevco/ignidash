"use client";

import { Input } from "@/components/catalyst/input";

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  desc?: string | React.ReactNode;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  desc,
}: NumberFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        aria-describedby={desc ? `${id}-desc` : undefined}
      />
      {desc && (
        <p id={`${id}-desc`} className="text-muted-foreground mt-2 text-xs">
          {desc}
        </p>
      )}
    </div>
  );
}
