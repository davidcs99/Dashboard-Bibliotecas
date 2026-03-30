"use client";

import { useDashboardFiltersStore } from "@/store/use-dashboard-filters-store";
import { useShallow } from "zustand/react/shallow";

export function useDashboardQueryFilters() {
  return useDashboardFiltersStore(
    useShallow((state) => ({
      years: state.selectedYears,
      months: state.selectedMonths,
      campuses: state.selectedCampuses,
      academicUnits: state.selectedAcademicUnits,
      programs: state.selectedPrograms,
      modalities: state.selectedModalities,
      roles: state.selectedRoles,
      resources: state.selectedResources,
      resourceTypes: state.selectedResourceTypes,
      users: state.selectedUsers
    }))
  );
}
