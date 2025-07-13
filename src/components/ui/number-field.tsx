"use client";

import { Input } from "@/components/catalyst/input";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "") {
      onChange(null);
      return;
    }

    // Allow users to type "-" or "." without blocking
    if (inputValue === "-" || inputValue === "." || inputValue === "-.") {
      return; // Don't update store, let them finish typing
    }

    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      onChange(numericValue);
    }
  };

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
        value={value ?? ""}
        onChange={handleChange}
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
