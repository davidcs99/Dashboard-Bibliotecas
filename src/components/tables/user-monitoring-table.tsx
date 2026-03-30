"use client";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import type { UserMonitoringRow } from "@/types/dashboard";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

type UserMonitoringTableProperties = {
  rows: UserMonitoringRow[];
};

const columnDefinitions: ColDef<UserMonitoringRow>[] = [
  { field: "identification", headerName: "Identificacion", filter: true, minWidth: 150 },
  { field: "fullName", headerName: "Nombre", filter: true, minWidth: 230 },
  { field: "role", headerName: "Cargo", filter: true, minWidth: 150 },
  { field: "academicUnit", headerName: "Unidad academica", filter: true, minWidth: 260 },
  { field: "program", headerName: "Carrera", filter: true, minWidth: 220 },
  { field: "campus", headerName: "Sede", filter: true, minWidth: 180 },
  { field: "totalEvents", headerName: "Eventos", filter: "agNumberColumnFilter", minWidth: 120 },
  { field: "totalSearches", headerName: "Busquedas", filter: "agNumberColumnFilter", minWidth: 120 },
  { field: "totalResourceAccesses", headerName: "Accesos a recursos", filter: "agNumberColumnFilter", minWidth: 170 },
  { field: "firstUsageDate", headerName: "Primer uso", filter: true, minWidth: 130 },
  { field: "lastUsageDate", headerName: "Ultimo uso", filter: true, minWidth: 130 }
];

const defaultColumnDefinition: ColDef<UserMonitoringRow> = {
  sortable: true,
  resizable: true,
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

export function UserMonitoringTable({ rows }: UserMonitoringTableProperties) {
  return (
    <Card
      sx={{
        overflow: "hidden",
        borderRadius: 0
      }}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" sx={{ color: "#991012", letterSpacing: 1.5, fontWeight: 700 }}>
              Analitica Individual
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.35 }}>
              Seguimiento Individual de Usuarios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
              Explora actividad acumulada, búsquedas y accesos por usuario con filtros rápidos sobre cada columna.
            </Typography>
          </Box>

          <Box
            sx={{
              borderRadius: 0,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper",
              boxShadow: "0 10px 24px rgba(24, 33, 47, 0.05)",
              "& .ag-theme-alpine": {
                "--ag-background-color": "#ffffff",
                "--ag-foreground-color": "#18212f",
                "--ag-border-color": "#d4dbe5",
                "--ag-secondary-border-color": "#e3e8f0",
                "--ag-header-background-color": "#374966",
                "--ag-header-foreground-color": "#ffffff",
                "--ag-header-column-separator-color": "rgba(255, 255, 255, 0.18)",
                "--ag-row-border-color": "#e8edf4",
                "--ag-odd-row-background-color": "#f7f9fc",
                "--ag-alpine-active-color": "#991012",
                "--ag-selected-row-background-color": "rgba(17, 141, 255, 0.10)",
                "--ag-range-selection-border-color": "#118DFF",
                "--ag-input-focus-border-color": "#991012",
                "--ag-font-family": "\"Aptos\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
                "--ag-font-size": "14px",
                "--ag-grid-size": "8px",
                "--ag-list-item-height": "36px",
                "--ag-input-text-color": "#18212f",
                "--ag-input-border-color": "#cfd8e3",
                "--ag-input-background-color": "#ffffff",
                "--ag-control-panel-background-color": "#f8fafd",
                "--ag-subheader-background-color": "#f3f6fa"
              },
              "& .ag-root-wrapper": {
                border: "none",
                borderRadius: 0
              },
              "& .ag-root, & .ag-body-viewport, & .ag-center-cols-viewport, & .ag-center-cols-container": {
                borderRadius: 0
              },
              "& .ag-header": {
                borderBottom: "1px solid #31415b"
              },
              "& .ag-header-cell": {
                fontWeight: 700,
                paddingTop: "6px",
                paddingBottom: "6px"
              },
              "& .ag-header-cell-label": {
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: "12px"
              },
              "& .ag-header-cell::after": {
                top: "18%",
                height: "64%"
              },
              "& .ag-row": {
                transition: "background-color 120ms ease",
                borderBottom: "1px solid #e8edf4"
              },
              "& .ag-row:hover": {
                backgroundColor: "rgba(17, 141, 255, 0.06) !important"
              },
              "& .ag-cell": {
                display: "flex",
                alignItems: "center",
                lineHeight: 1.45,
                paddingTop: "4px",
                paddingBottom: "4px"
              },
              "& .ag-floating-filter": {
                backgroundColor: "#f4f7fb",
                borderTop: "none"
              },
              "& .ag-floating-filter-body": {
                paddingTop: "2px",
                paddingBottom: "2px"
              },
              "& .ag-input-field-input": {
                color: "#18212f !important",
                backgroundColor: "#ffffff !important",
                border: "1px solid #cfd8e3 !important",
                boxShadow: "none !important",
                fontSize: "13px"
              },
              "& .ag-input-field-input::placeholder": {
                color: "#7a8596 !important"
              },
              "& .ag-floating-filter-button": {
                color: "#6f7c8f"
              },
              "& .ag-paging-panel": {
                borderTop: "1px solid #e3e8f0",
                backgroundColor: "#fbfcfe",
                color: "#5b6472",
                minHeight: 56,
                borderRadius: 0
              },
              "& .ag-picker-field-wrapper, & .ag-input-field-input": {
                borderRadius: 0
              },
              "& .ag-picker-field-wrapper": {
                backgroundColor: "#ffffff",
                border: "1px solid #d4dbe5"
              },
              "& .ag-cell-value": {
                overflow: "hidden",
                textOverflow: "ellipsis"
              },
              "& .ag-icon": {
                color: "inherit"
              }
            }}
          >
            <div className="ag-theme-alpine" style={{ height: 560, width: "100%" }}>
              <AgGridReact
                rowData={rows}
                columnDefs={columnDefinitions}
                defaultColDef={defaultColumnDefinition}
                theme="legacy"
                animateRows
                pagination
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 25, 50]}
              />
            </div>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
