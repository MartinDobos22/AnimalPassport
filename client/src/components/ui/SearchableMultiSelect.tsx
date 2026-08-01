import { Autocomplete, Checkbox, Chip, TextField } from '@mui/material';
import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
} from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface MultiSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  values: T[];
  options: MultiSelectOption<T>[];
  onChange: (values: T[]) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  placeholder?: string;
  disabled?: boolean;
  limitTags?: number;
  sx?: SxProps<Theme>;
}

/**
 * Multi-select dropdown with type-to-filter search, built on MUI Autocomplete.
 * Companion to `SearchableSelect` for the case where several values can be picked
 * at once (e.g. filtering a list by multiple categories). Selected values render
 * as chips; an empty selection means "no filter".
 */
export default function SearchableMultiSelect<T extends string>({
  label,
  values,
  options,
  onChange,
  size = 'small',
  fullWidth,
  placeholder,
  disabled,
  limitTags = 2,
  sx,
}: Props<T>) {
  const selected = options.filter((o) => values.includes(o.value));
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={selected}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      sx={sx}
      limitTags={limitTags}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      onChange={(_, next) => onChange(next.map((o) => o.value))}
      renderOption={(props, option, { selected: isSelected }) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Checkbox
              icon={<CheckBoxBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              checked={isSelected}
              sx={{ mr: 1 }}
            />
            {option.label}
          </li>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return <Chip key={key} label={option.label} size="small" {...tagProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={selected.length === 0 ? placeholder : undefined}
        />
      )}
    />
  );
}
