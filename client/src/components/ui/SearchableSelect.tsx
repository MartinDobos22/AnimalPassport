import { Autocomplete, TextField } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /** When true (default) the field always keeps a value — no clear button. */
  disableClearable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
}

/**
 * Dropdown with type-to-filter search, built on MUI Autocomplete. Drop-in for the
 * common `<Select>` + `<MenuItem>` pattern: pass `{ value, label }[]` options and a
 * string-union value. The user can type to narrow the list.
 */
export default function SearchableSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'small',
  fullWidth,
  disableClearable = true,
  placeholder,
  disabled,
  error,
  helperText,
  sx,
}: Props<T>) {
  const selected = options.find((o) => o.value === value) ?? null;
  return (
    <Autocomplete
      options={options}
      value={selected}
      disabled={disabled}
      disableClearable={disableClearable}
      size={size}
      fullWidth={fullWidth}
      sx={sx}
      autoHighlight
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      onChange={(_, next) => onChange((next?.value ?? ('' as T)) as T)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
