import { create } from "zustand";
import type { DashboardQueryFilters } from "@/types/dashboard";

type DashboardFiltersState = {
  selectedYears: string[];
  selectedMonths: string[];
  selectedCampuses: string[];
  selectedAcademicUnits: string[];
  selectedPrograms: string[];
  selectedModalities: string[];
  selectedAccessTypes: string[];
  selectedRoles: string[];
  selectedResources: string[];
  selectedResourceTypes: string[];
  selectedUsers: string[];
  setSelectedYears: (selectedYears: string[]) => void;
  setSelectedMonths: (selectedMonths: string[]) => void;
  setSelectedCampuses: (selectedCampuses: string[]) => void;
  setSelectedAcademicUnits: (selectedAcademicUnits: string[]) => void;
  setSelectedPrograms: (selectedPrograms: string[]) => void;
  setSelectedModalities: (selectedModalities: string[]) => void;
  setSelectedAccessTypes: (selectedAccessTypes: string[]) => void;
  setSelectedRoles: (selectedRoles: string[]) => void;
  setSelectedResources: (selectedResources: string[]) => void;
  setSelectedResourceTypes: (selectedResourceTypes: string[]) => void;
  setSelectedUsers: (selectedUsers: string[]) => void;
  setAllFilters: (filters: DashboardQueryFilters) => void;
  resetFilters: () => void;
};

const initialDashboardFiltersState = {
  selectedYears: [],
  selectedMonths: [],
  selectedCampuses: [],
  selectedAcademicUnits: [],
  selectedPrograms: [],
  selectedModalities: [],
  selectedAccessTypes: [],
  selectedRoles: [],
  selectedResources: [],
  selectedResourceTypes: [],
  selectedUsers: []
};

export const useDashboardFiltersStore = create<DashboardFiltersState>((set) => ({
  ...initialDashboardFiltersState,
  setSelectedYears: (selectedYears) => set({ selectedYears }),
  setSelectedMonths: (selectedMonths) => set({ selectedMonths }),
  setSelectedCampuses: (selectedCampuses) => set({ selectedCampuses }),
  setSelectedAcademicUnits: (selectedAcademicUnits) => set({ selectedAcademicUnits }),
  setSelectedPrograms: (selectedPrograms) => set({ selectedPrograms }),
  setSelectedModalities: (selectedModalities) => set({ selectedModalities }),
  setSelectedAccessTypes: (selectedAccessTypes) => set({ selectedAccessTypes }),
  setSelectedRoles: (selectedRoles) => set({ selectedRoles }),
  setSelectedResources: (selectedResources) => set({ selectedResources }),
  setSelectedResourceTypes: (selectedResourceTypes) => set({ selectedResourceTypes }),
  setSelectedUsers: (selectedUsers) => set({ selectedUsers }),
  setAllFilters: (filters) =>
    set({
      selectedYears: filters.years,
      selectedMonths: filters.months,
      selectedCampuses: filters.campuses,
      selectedAcademicUnits: filters.academicUnits,
      selectedPrograms: filters.programs,
      selectedModalities: filters.modalities,
      selectedAccessTypes: filters.accessTypes,
      selectedRoles: filters.roles,
      selectedResources: filters.resources,
      selectedResourceTypes: filters.resourceTypes,
      selectedUsers: filters.users
    }),
  resetFilters: () => set(initialDashboardFiltersState)
}));
