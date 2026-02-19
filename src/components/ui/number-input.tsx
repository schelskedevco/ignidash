import { NumericFormat, type NumberFormatValues } from 'react-number-format';
import { Input } from '@/components/catalyst/input';
import { useController, type UseControllerProps, type FieldValues, type FieldPath } from 'react-hook-form';

interface NumberInputProps {
  id: string;
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  step?: number;
  min?: number;
  max?: number;
  autoFocus?: boolean;
  disableThousandsSeparator?: boolean;
  readOnly?: boolean;
}

export default function NumberInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  id,
  inputMode,
  placeholder,
  prefix,
  suffix,
  decimalScale = 2,
  step,
  min,
  max,
  autoFocus,
  disableThousandsSeparator,
  readOnly,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  control,
  disabled,
}: NumberInputProps & UseControllerProps<TFieldValues, TName>) {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({
    name,
    rules,
    shouldUnregister,
    defaultValue,
    control,
    disabled,
  });

  const handleValueChange = (values: NumberFormatValues) => {
    const value = values.value;
    onChange(value !== '' ? value : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (step === undefined || min === undefined || max === undefined) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentValue = parseFloat(value || '0');
      const newValue = Math.min(currentValue + step, max);
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentValue = parseFloat(value || '0');
      const newValue = Math.max(currentValue - step, min);
      onChange(newValue);
    }
  };

  return (
    <NumericFormat
      value={value}
      onKeyDown={handleKeyDown}
      onValueChange={handleValueChange}
      onBlur={onBlur}
      getInputRef={ref}
      id={id}
      name={name}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete="off"
      thousandSeparator={disableThousandsSeparator ? undefined : ','}
      decimalSeparator="."
      prefix={prefix}
      suffix={suffix}
      decimalScale={decimalScale}
      allowNegative={true}
      allowLeadingZeros={false}
      customInput={Input}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={!!error}
      invalid={!!error}
      isAllowed={({ value }) => value.length <= 12}
      autoFocus={autoFocus}
    />
  );
}
