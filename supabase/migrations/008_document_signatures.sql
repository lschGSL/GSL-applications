-- Migration 008: Document signatures (simple electronic signature)
-- Prepares for future LuxTrust integration

CREATE TABLE public.document_signatures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  signed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  signature_hash text NOT NULL,  -- SHA-256 hash of document content + signer ID + timestamp
  method text NOT NULL DEFAULT 'simple' CHECK (method IN ('simple', 'luxtrust', 'docusign')),
  metadata jsonb,  -- For future provider-specific data
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_signatures_document ON public.document_signatures(document_id);
CREATE INDEX idx_document_signatures_signed_by ON public.document_signatures(signed_by);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures on their documents"
  ON public.document_signatures FOR SELECT
  USING (
    signed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.client_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Authenticated users can sign"
  ON public.document_signatures FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add signature status to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signature_required boolean DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signed_at timestamptz;
