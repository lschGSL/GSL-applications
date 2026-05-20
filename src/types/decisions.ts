export type DecisionStatus = "Accepté" | "Proposé" | "Obsolète" | "Remplacé";

export interface Decision {
  id: string;
  number: string;
  slug: string;
  title: string;
  status: DecisionStatus;
  summary: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  domain_id: string | null;
  tags: string[];
}
