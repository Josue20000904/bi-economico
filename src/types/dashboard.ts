export type FilterOption = {
  value: string;
  label: string;
};

export type DashboardFiltersState = {
  segment: string;
  company: string;
  period: string;
  companyMetric: string;
  economicIndicator: string;
  lag: string;
  frequency: string;
};

export type DashboardView =
  | "overview"
  | "relations"
  | "diagnostics";