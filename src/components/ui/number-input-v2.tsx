import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/catalyst/input';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface NumberInputV2Props {
  id: string;
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
}

export default function NumberInputV2({
  id,
  inputMode,
  placeholder,
  prefix,
  suffix,
  decimalScale = 2,
  ref,
  ...otherProps
}: NumberInputV2Props & UseFormRegisterReturn) {
  return (
    <NumericFormat
      {...otherProps}
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
      isAllowed={({ value }) => value.length <= 12}
    />
  );
}
