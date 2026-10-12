CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_coop_admin(_user_id UUID, _coop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cooperatives WHERE id = _coop_id AND admin_id = _user_id);
$$;

DROP POLICY "coop admin updates members" ON public.worker_profiles;
CREATE POLICY "coop admin updates members" ON public.worker_profiles FOR UPDATE TO authenticated
  USING (cooperative_id IS NOT NULL AND private.is_coop_admin(auth.uid(), cooperative_id))
  WITH CHECK (cooperative_id IS NOT NULL AND private.is_coop_admin(auth.uid(), cooperative_id));

DROP POLICY "booking parties can read" ON public.bookings;
CREATE POLICY "booking parties can read" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = worker_id OR (cooperative_id IS NOT NULL AND private.is_coop_admin(auth.uid(), cooperative_id)));

DROP POLICY "booking parties can update" ON public.bookings;
CREATE POLICY "booking parties can update" ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = worker_id OR (cooperative_id IS NOT NULL AND private.is_coop_admin(auth.uid(), cooperative_id)))
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = worker_id OR (cooperative_id IS NOT NULL AND private.is_coop_admin(auth.uid(), cooperative_id)));

DROP FUNCTION public.has_role(uuid, public.app_role);
DROP FUNCTION public.is_coop_admin(uuid, uuid);

REVOKE EXECUTE ON FUNCTION public.refresh_worker_rating() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bump_jobs_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;