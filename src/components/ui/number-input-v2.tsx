import { NumericFormat, type NumberFormatValues } from 'react-number-format';
import { Input } from '@/components/catalyst/input';
import { useController, type UseControllerProps, type FieldValues, type FieldPath } from 'react-hook-form';

interface NumberInputV2Props {
  id: string;
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
}

export default function NumberInputV2<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  id,
  inputMode,
  placeholder,
  prefix,
  suffix,
  decimalScale = 2,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  control,
  disabled,
}: NumberInputV2Props & UseControllerProps<TFieldValues, TName>) {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController<TFieldValues, TName>({
    name,
    rules,
    shouldUnregister,
    defaultValue,
    control,
    disabled,
  });

  const handleValueChange = (values: NumberFormatValues) => {
    onChange(values.value);
  };

  return (
    <NumericFormat
      value={value}
      onValueChange={handleValueChange}
      onBlur={onBlur}
      getInputRef={ref}
      id={id}
      name={name}
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
      disabled={disabled}
      aria-invalid={!!error}
      invalid={!!error}
      isAllowed={({ value }) => value.length <= 12}
    />
  );
}
