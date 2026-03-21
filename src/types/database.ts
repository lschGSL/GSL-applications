export type UserRole = "admin" | "manager" | "member" | "viewer";

export type AppVisibility = "internal" | "external" | "both";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
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
