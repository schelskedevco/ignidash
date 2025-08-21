import { NumericFormat, type NumberFormatValues } from 'react-number-format';
import { Input } from '@/components/catalyst/input';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface NumberInputV2Props {
  id: string;
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  invalid?: boolean;
}

export default function NumberInputV2({
  id,
  inputMode,
  placeholder,
  prefix,
  suffix,
  decimalScale = 2,
  invalid,
  ref,
  onChange,
  ...otherProps
}: NumberInputV2Props & UseFormRegisterReturn) {
  const handleValueChange = (values: NumberFormatValues) => {
    onChange({ target: { name: otherProps.name, value: values.value } });
  };

  return (
    <NumericFormat
      {...otherProps}
      onValueChange={handleValueChange}
      getInputRef={ref}
      id={id}
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
      aria-invalid={invalid}
      invalid={invalid}
      isAllowed={({ value }) => value.length <= 12}
    />
  );
}
