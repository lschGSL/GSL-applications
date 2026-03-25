-- Migration 006: Client role + Document management
-- Adds 'client' role, document_folders table, and documents table

-- 1. Extend profiles role to include 'client'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'member', 'viewer', 'client'));

-- 2. Extend invitations role to include 'client'
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('admin', 'manager', 'member', 'viewer', 'client'));

-- 3. Document folders table
CREATE TABLE public.document_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.document_folders(id) ON DELETE CASCADE,
  type text CHECK (type IN ('bilan', 'tva', 'salaires', 'general', 'other')),
  exercise_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_folders_client ON public.document_folders(client_id);
CREATE INDEX idx_document_folders_parent ON public.document_folders(parent_id);

-- Trigger for updated_at
CREATE TRIGGER update_document_folders_updated_at
  BEFORE UPDATE ON public.document_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own folders"
  ON public.document_folders FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admins/managers can view all folders"
  ON public.document_folders FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins/managers can manage folders"
  ON public.document_folders FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- 4. Documents table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_client ON public.documents(client_id);
CREATE INDEX idx_documents_folder ON public.documents(folder_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own documents"
  ON public.documents FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admins/managers can view all documents"
  ON public.documents FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Authenticated users can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins/managers can update any document"
  ON public.documents FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Clients can update own pending documents"
  ON public.documents FOR UPDATE
  USING (client_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins/managers can delete documents"
  ON public.documents FOR DELETE
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- 5. Storage bucket (manual step via Supabase dashboard)
-- Create bucket 'documents' with:
--   - Private (not public)
--   - Max file size: 50MB
--   - Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, image/png, image/jpeg
