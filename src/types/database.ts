export type UserRole = "admin" | "manager" | "member" | "viewer" | "client";

export type AppVisibility = "internal" | "external" | "both";

export type GslEntity = "gsl_fiduciaire" | "gsl_revision" | "both";

export type DocumentStatus = "pending" | "approved" | "rejected";

export type RequestStatus = "pending" | "uploaded" | "approved" | "rejected" | "cancelled";

export type FolderType = "bilan" | "tva" | "salaires" | "general" | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  entity: GslEntity | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  icon_url: string | null;
  visibility: AppVisibility;
  entity: GslEntity | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppAccess {
  id: string;
  user_id: string;
  app_id: string;
  granted_by: string | null;
  granted_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined fields
  user_email?: string;
  user_name?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  entity: GslEntity | null;
  // SHA-256 digest of the clear token. The clear value is never persisted —
  // it lives only in the invitation email URL.
  token_hash: string;
  // Legacy clear-text column kept temporarily for rollback safety; ignored
  // by the application.
  token?: string | null;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  // Joined
  inviter_name?: string;
  inviter_email?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  client_id: string;
  parent_id: string | null;
  type: FolderType | null;
  exercise_year: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  document_count?: number;
}

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  client_id: string;
  uploaded_by: string;
  folder_id: string | null;
  status: DocumentStatus;
  notes: string | null;
  signature_required: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  uploader_name?: string;
  uploader_email?: string;
  client_name?: string;
  client_email?: string;
  folder_name?: string;
}

export interface DocumentRequest {
  id: string;
  client_id: string;
  requested_by: string;
  title: string;
  description: string | null;
  folder_id: string | null;
  document_id: string | null;
  status: RequestStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  client_name?: string;
  client_email?: string;
  requester_name?: string;
  requester_email?: string;
}

export type SignatureMethod = "simple" | "luxtrust" | "docusign";

export interface DocumentSignature {
  id: string;
  document_id: string;
  signed_by: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  signature_hash: string;
  method: SignatureMethod;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined
  signer_name?: string;
  signer_email?: string;
}

export type DomainColor =
  | "blue"
  | "green"
  | "amber"
  | "purple"
  | "teal"
  | "coral"
  | "pink"
  | "gray";

export interface Domain {
  id: string;
  name: string;
  slug: string;
  color: DomainColor;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Aggregated counts (set by GET /api/domains and GET /api/admin/domains)
  procedure_count?: number;
  decision_count?: number;
  formation_count?: number;
  total_count?: number;
}

export type ProcedureStatus = "draft" | "published" | "archived";

export interface ProcedureCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  published: boolean;
  placeholder: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  procedure_count?: number;
}

export interface Procedure {
  id: string;
  number: string;
  slug: string;
  title: string;
  /** Legacy free-text category — conservée pour compatibilité ascendante. */
  category: string;
  /** FK vers procedure_categories — nouvelle taxonomie. */
  category_id: string | null;
  summary: string | null;
  content: string;
  version: string;
  owner: string | null;
  status: ProcedureStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SignatureRequestStatus = "pending" | "signed" | "declined";

export interface SignatureRequest {
  id: string;
  document_id: string;
  signer_id: string;
  requested_by: string;
  status: SignatureRequestStatus;
  signed_at: string | null;
  signature_id: string | null;
  created_at: string;
  // Joined
  signer_name?: string;
  signer_email?: string;
  document_name?: string;
  requester_name?: string;
}
