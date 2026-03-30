"use client";

import { Card, CardContent, Typography } from "@mui/material";
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

export function UserMonitoringTable({ rows }: UserMonitoringTableProperties) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Seguimiento Individual de Usuarios
        </Typography>
        <div className="ag-theme-alpine" style={{ height: 560, width: "100%" }}>
          <AgGridReact
            rowData={rows}
            columnDefs={columnDefinitions}
            theme="legacy"
            pagination
            paginationPageSize={10}
          />
        </div>
      </CardContent>
    </Card>
  );
}
