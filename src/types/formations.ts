export interface Formation {
  id: string;
  number: string;
  slug: string;
  title: string;
  duration_min: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  domain_id: string | null;
  tags: string[];
}
