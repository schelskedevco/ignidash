'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/catalyst/input';
import { NumericFormat } from 'react-number-format';

interface NumberInputProps {
  id: string;
  label: string;
  value: number | null;
  onBlur: (value: string | null) => { success: boolean; error?: string };
  inputMode: 'numeric' | 'decimal';
  placeholder?: string;
  desc?: string | React.ReactNode;
  // Formatting props
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  allowNegative?: boolean;
  allowLeadingZeros?: boolean;
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
  allowNegative = true,
  allowLeadingZeros = false,
}: NumberInputProps) {
  // Local string state that allows incomplete inputs
  const [localValue, setLocalValue] = useState<string>(() => value?.toString() ?? '');

  // Local error state for displaying validation errors
  const [error, setError] = useState<string | null>(null);

  // Sync external value changes to local state
  useEffect(() => {
    setLocalValue(value?.toString() ?? '');
  }, [value]);

  const handleValueChange = (values: { value: string; formattedValue: string; floatValue?: number }) => {
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
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
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
        allowNegative={allowNegative}
        allowLeadingZeros={allowLeadingZeros}
        customInput={Input}
        aria-describedby={desc ? `${id}-desc` : undefined}
        isAllowed={(values) => {
          const { value } = values;
          return value.length <= 12;
        }}
      />
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {desc && (
        <p id={`${id}-desc`} className="text-muted-foreground mt-2 text-xs">
          {desc}
        </p>
      )}
    </div>
  );
}
