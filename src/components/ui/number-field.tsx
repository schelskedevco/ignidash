"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/catalyst/input";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number | null;
  onBlur: (value: string | null) => { success: boolean; error?: string };
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
  onBlur,
  placeholder,
  min,
  max,
  step,
  desc,
}: NumberFieldProps) {
  // Local string state that allows incomplete inputs
  const [localValue, setLocalValue] = useState<string>(
    () => value?.toString() ?? ""
  );

  // Local error state for displaying validation errors
  const [error, setError] = useState<string | null>(null);

  // Sync external value changes to local state
  useEffect(() => {
    setLocalValue(value?.toString() ?? "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (error) {
      setError(null);
    }

    setLocalValue(inputValue);
  };

  const handleBlur = () => {
    const result = onBlur(localValue !== "" ? localValue : null);
    if (!result.success && result.error) {
      setError(result.error);
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
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        aria-describedby={desc ? `${id}-desc` : undefined}
      />
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {desc && (
        <p id={`${id}-desc`} className="text-muted-foreground mt-2 text-xs">
          {desc}
        </p>
      )}
    </div>
  );
}
