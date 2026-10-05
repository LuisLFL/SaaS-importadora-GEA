import React, { useState, useEffect } from 'react';

export interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onValueChange: (val: number) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  fallbackOnBlur?: number;
  autoSelectOnFocus?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  allowDecimals = true,
  min,
  max,
  fallbackOnBlur = 0,
  autoSelectOnFocus = true,
  className = '',
  onFocus,
  onBlur,
  ...rest
}) => {
  const [text, setText] = useState<string>(() => {
    if (value === undefined || value === null || isNaN(value)) return '';
    return String(value);
  });
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Sync external changes when not focused
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null || isNaN(value)) {
        setText('');
      } else {
        setText(String(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Allow empty string or just decimal dot while typing
    if (raw === '' || raw === '.') {
      setText(raw);
      onValueChange(fallbackOnBlur);
      return;
    }

    // Only allow digits and one decimal dot (if decimals allowed)
    if (allowDecimals) {
      if (!/^[0-9]*\.?[0-9]*$/.test(raw)) return;
    } else {
      if (!/^[0-9]*$/.test(raw)) return;
    }

    setText(raw);
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed)) {
      let finalVal = parsed;
      if (max !== undefined && finalVal > max) finalVal = max;
      if (min !== undefined && finalVal < min && raw.length > 3) finalVal = min;
      onValueChange(finalVal);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (autoSelectOnFocus) {
      e.target.select();
    }
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    let finalVal = fallbackOnBlur;

    if (text !== '' && text !== '.') {
      const parsed = allowDecimals ? parseFloat(text) : parseInt(text, 10);
      if (!isNaN(parsed)) {
        finalVal = parsed;
        if (min !== undefined && finalVal < min) finalVal = min;
        if (max !== undefined && finalVal > max) finalVal = max;
      }
    }

    setText(String(finalVal));
    onValueChange(finalVal);
    if (onBlur) onBlur(e);
  };

  return (
    <input
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
};
