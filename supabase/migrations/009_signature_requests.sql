-- Migration 009: Signature requests (multi-signer support)
-- Admin sends a document to multiple people for signature

CREATE TABLE public.signature_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  signed_at timestamptz,
  signature_id uuid REFERENCES public.document_signatures(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, signer_id)
);

CREATE INDEX idx_signature_requests_document ON public.signature_requests(document_id);
CREATE INDEX idx_signature_requests_signer ON public.signature_requests(signer_id);
CREATE INDEX idx_signature_requests_status ON public.signature_requests(status);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signers can view own requests"
  ON public.signature_requests FOR SELECT
  USING (signer_id = auth.uid());

CREATE POLICY "Admins/managers can view all requests"
  ON public.signature_requests FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins/managers can manage requests"
  ON public.signature_requests FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Signers can update own pending requests"
  ON public.signature_requests FOR UPDATE
  USING (signer_id = auth.uid() AND status = 'pending');
