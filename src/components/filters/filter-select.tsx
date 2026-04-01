"use client";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Autocomplete, Checkbox, TextField } from "@mui/material";

type FilterSelectProperties = {
  label: string;
  values: string[];
  options: string[];
  onChange: (selectedValues: string[]) => void;
};

export function FilterSelect({
  label,
  values,
  options,
  onChange
}: FilterSelectProperties) {
  const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={values}
      onChange={(_event, selectedValues) => onChange(selectedValues)}
      isOptionEqualToValue={(option, value) => option === value}
      limitTags={1}
      renderOption={(properties, option, { selected }) => {
        const { key, ...optionProperties } = properties;

        return (
          <li key={key} {...optionProperties}>
            <Checkbox
              icon={uncheckedIcon}
              checkedIcon={checkedIcon}
              checked={selected}
              sx={{ mr: 1, color: "primary.main" }}
            />
            {option}
          </li>
        );
      }}
      renderInput={(parameters) => (
        <TextField
          {...parameters}
          label={label}
          size="small"
          placeholder={values.length === 0 ? "Escribe para buscar" : undefined}
        />
      )}
      sx={{
        "& .MuiAutocomplete-inputRoot": {
          py: 0.85
        }
      }}
    />
  );
}
