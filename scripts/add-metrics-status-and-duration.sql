-- Run on the shared auth database before deploying the CBB API change.
BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.metrics
  ADD COLUMN status_code smallint,
  ADD COLUMN duration_ms integer;
COMMIT;
