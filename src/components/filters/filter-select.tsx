"use client";

import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent } from "@mui/material";

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
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onChange(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={values}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selectedValues) => selectedValues.join(", ")}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            <Checkbox checked={values.includes(option)} />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
