-- ============================================================
-- Sprint C — SSO exchange codes
--
-- Replace the previous "tokens in the URL" SSO flow with an opaque
-- one-time code + server-to-server exchange.
--
-- The portal mints a 32-byte random code at the moment the user clicks
-- "Open app", stores the Supabase access/refresh tokens against that
-- code, and only sends the code in the URL. The satellite app POSTs
-- the code back to the portal's /api/auth/sso/exchange endpoint to
-- swap it for the actual tokens.
--
-- The row is single-use (UPDATE ... WHERE used_at IS NULL) and lives
-- 60 seconds. Only the service role can read or write this table —
-- the RLS policy denies every authenticated request.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.sso_exchange_codes (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          text        NOT NULL UNIQUE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_slug      text        NOT NULL,
  target_url    text        NOT NULL,
  access_token  text        NOT NULL,
  refresh_token text        NOT NULL,
  used_at       timestamptz,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '60 seconds'),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sso_exchange_codes ENABLE ROW LEVEL SECURITY;

-- Deny every non-service-role request. The service role bypasses RLS,
-- so this effectively makes the table service-role-only.
DROP POLICY IF EXISTS "Service role only" ON public.sso_exchange_codes;
CREATE POLICY "Service role only"
  ON public.sso_exchange_codes
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_sso_codes_expires
  ON public.sso_exchange_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sso_codes_code
  ON public.sso_exchange_codes(code);
