'use client';

import { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';

import { Input } from '@/components/catalyst/input';

interface NumberInputProps {
  id: string;
  label?: string | React.ReactNode;
  value: number | null;
  onBlur: (value: string | null) => { success: boolean; error?: string };
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  desc?: string | React.ReactNode;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
}

export default function NumberInput({
  id,
  label,
  value,
  onBlur,
  inputMode,
  placeholder,
  desc,
  prefix,
  suffix,
  decimalScale = 2,
}: NumberInputProps) {
  // Local string state that allows incomplete inputs
  const [localValue, setLocalValue] = useState<string>(() => `${value ?? ''}`);

  // Local error state for displaying validation errors
  const [error, setError] = useState<string | null>(null);

  // Sync external value changes to local state
  useEffect(() => {
    setLocalValue(`${value ?? ''}`);
  }, [value]);

  const handleValueChange = (values: { value: string; formattedValue: string; floatValue?: number }) => {
    // Reset error state on input change
    if (error) {
      setError(null);
    }

    // Store the unformatted string value
    setLocalValue(values.value);
  };

  const handleBlur = () => {
    const result = onBlur(localValue !== '' ? localValue : null);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm/6 font-medium">
          {label}
        </label>
      )}
      <NumericFormat
        id={id}
        value={localValue}
        onValueChange={handleValueChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        thousandSeparator=","
        decimalSeparator="."
        prefix={prefix}
        suffix={suffix}
        decimalScale={decimalScale}
        allowNegative={true}
        allowLeadingZeros={false}
        customInput={Input}
        aria-invalid={!!error}
        aria-describedby={error || desc ? `${id}-message` : undefined}
        isAllowed={({ value }) => value.length <= 12}
      />
      {error ? (
        <p id={`${id}-message`} className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : (
        desc && (
          <p id={`${id}-message`} className="text-muted-foreground mt-2 text-sm">
            {desc}
          </p>
        )
      )}
    </div>
  );
}
