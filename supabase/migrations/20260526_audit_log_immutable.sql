-- ============================================================
-- Sprint B — Audit log append-only
--
-- audit_logs must be immutable: even admins and the service role
-- cannot rewrite or erase past events. We enforce this with a
-- trigger that raises on UPDATE / DELETE. INSERTs remain allowed
-- (RLS still gates who can read).
--
-- Note: original numbering 012_ was already taken; we use the
-- date-based naming convention used by the recent migrations.
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_logs_block_mutations()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only; % is not permitted', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_block_mutations();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON public.audit_logs;
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_block_mutations();
