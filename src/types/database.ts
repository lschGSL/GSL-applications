export type UserRole = "admin" | "manager" | "member" | "viewer" | "client";

export type AppVisibility = "internal" | "external" | "both";

export type GslEntity = "gsl_fiduciaire" | "gsl_revision" | "both";

export type DocumentStatus = "pending" | "approved" | "rejected";

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
  token: string;
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
  created_at: string;
  updated_at: string;
  // Joined fields
  uploader_name?: string;
  uploader_email?: string;
  client_name?: string;
  client_email?: string;
  folder_name?: string;
}
