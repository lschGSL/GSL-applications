export type ProcedureStatus = "draft" | "published" | "archived";

export type ProcedureCategory =
  | "portal"
  | "rh"
  | "it"
  | "comptabilite"
  | "audit";

export const PROCEDURE_CATEGORIES: ProcedureCategory[] = [
  "portal",
  "rh",
  "it",
  "comptabilite",
  "audit",
];

export const PROCEDURE_STATUSES: ProcedureStatus[] = [
  "draft",
  "published",
  "archived",
];

export const PROCEDURE_CATEGORY_LABELS: Record<ProcedureCategory, string> = {
  portal: "Portail",
  rh: "RH",
  it: "IT",
  comptabilite: "Comptabilité",
  audit: "Audit",
};

export interface Procedure {
  id: string;
  number: string;
  slug: string;
  title: string;
  category: ProcedureCategory;
  summary: string | null;
  content: string;
  version: string;
  owner: string | null;
  status: ProcedureStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
