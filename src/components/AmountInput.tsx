import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formatNumberWithSeparators = (num: string): string => {
  const cleaned = num.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join('.');
};

const removeSeparators = (num: string): string => {
  return num.replace(/\./g, '');
};

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function AmountInput({ value, onChange, label, placeholder = '0.00', className }: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(value ? formatNumberWithSeparators(value) : '');
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const noSeparators = removeSeparators(raw);
    if (noSeparators === '' || /^\d*\.?\d*$/.test(noSeparators)) {
      onChange(noSeparators);
      setDisplayValue(formatNumberWithSeparators(noSeparators));
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setDisplayValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    setDisplayValue(value ? formatNumberWithSeparators(value) : '');
  }, [value]);

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inputMode="decimal"
        placeholder={placeholder}
      />
    </div>
  );
}
