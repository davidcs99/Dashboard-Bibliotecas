"use client";

import { Alert, AlertTitle } from "@mui/material";

type PageErrorStateProperties = {
  title: string;
  description: string;
};

export function PageErrorState({
  title,
  description
}: PageErrorStateProperties) {
  return (
    <Alert severity="error">
      <AlertTitle>{title}</AlertTitle>
      {description}
    </Alert>
  );
}
