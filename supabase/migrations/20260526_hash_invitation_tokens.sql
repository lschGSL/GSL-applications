-- ============================================================
-- Sprint B — Hash invitation tokens
--
-- Goal: stop persisting invitation tokens in clear. We now only
-- keep their SHA-256 digest; the clear token is generated server
-- side, sent in the email link, and never written back to DB.
--
-- Existing pending invitations become invalid (the clear token is
-- not recoverable from the previous default value of `token`).
-- Admins will need to re-issue them. This is acceptable.
--
-- Note: original numbering 011_/012_ was already taken; we use
-- the date-based naming convention used by the recent migrations.
-- ============================================================

-- 0. pgcrypto powers `digest()`. It is already required by the
--    existing default `gen_random_bytes(32)` from 004_invitations.sql
--    but we re-assert it so this migration is self-contained.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add the new column.
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS token_hash text;

-- 2. Copy the existing (clear) tokens over so old rows stay
--    distinct; they will not validate anyway because the
--    application now hashes input before comparing.
UPDATE public.invitations
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

-- 3. Drop the unique constraint on the clear token. We list the
--    likely auto-generated name produced by Postgres for the
--    inline UNIQUE in 004_invitations.sql.
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_token_key;

-- 4. Drop the index that backed it, if it survived.
DROP INDEX IF EXISTS public.idx_invitations_token;

-- 5. Drop the default that auto-generated a clear token.
ALTER TABLE public.invitations
  ALTER COLUMN token DROP DEFAULT;

-- 6. Make `token` nullable so future inserts can omit it.
ALTER TABLE public.invitations
  ALTER COLUMN token DROP NOT NULL;

-- 7. New unique constraint on the hash.
CREATE UNIQUE INDEX IF NOT EXISTS invitations_token_hash_key
  ON public.invitations(token_hash);

-- 8. The `token` column is kept temporarily for rollback safety
--    but is no longer read by the application. A follow-up
--    migration can drop it once we are confident.
