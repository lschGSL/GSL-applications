-- Migration 007: Document requests workflow
-- Admin/manager creates a request -> client receives email -> uploads doc -> admin reviews

CREATE TABLE public.document_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected', 'cancelled')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_requests_client ON public.document_requests(client_id);
CREATE INDEX idx_document_requests_status ON public.document_requests(status);
CREATE INDEX idx_document_requests_requested_by ON public.document_requests(requested_by);

CREATE TRIGGER update_document_requests_updated_at
  BEFORE UPDATE ON public.document_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own requests"
  ON public.document_requests FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admins/managers can view all requests"
  ON public.document_requests FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins/managers can manage requests"
  ON public.document_requests FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Clients can update own pending requests"
  ON public.document_requests FOR UPDATE
  USING (client_id = auth.uid() AND status = 'pending');
