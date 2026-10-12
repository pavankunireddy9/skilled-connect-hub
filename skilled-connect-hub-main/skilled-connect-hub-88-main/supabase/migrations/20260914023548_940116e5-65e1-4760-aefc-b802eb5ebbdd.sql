CREATE POLICY "providers read open requests"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  worker_id IS NULL
  AND status = 'requested'
  AND private.has_role(auth.uid(), 'provider'::public.app_role)
);

CREATE POLICY "provider claims open request"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  worker_id IS NULL
  AND status = 'requested'
  AND private.has_role(auth.uid(), 'provider'::public.app_role)
)
WITH CHECK (worker_id = auth.uid());