CREATE TYPE public.app_role AS ENUM ('customer','provider','coop_admin');
CREATE TYPE public.booking_status AS ENUM ('requested','accepted','in_progress','completed','cancelled');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by signed in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.cooperatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  registration TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  assignment_rule TEXT NOT NULL DEFAULT 'manual',
  payment_share INT NOT NULL DEFAULT 10,
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cooperatives TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cooperatives TO authenticated;
GRANT ALL ON public.cooperatives TO service_role;
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooperatives are public" ON public.cooperatives FOR SELECT USING (true);
CREATE POLICY "admin creates cooperative" ON public.cooperatives FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "admin updates cooperative" ON public.cooperatives FOR UPDATE TO authenticated USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

CREATE OR REPLACE FUNCTION public.is_coop_admin(_user_id UUID, _coop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.cooperatives WHERE id = _coop_id AND admin_id = _user_id);
$$;

CREATE TABLE public.worker_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  trade TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  rate INT NOT NULL DEFAULT 0,
  experience INT NOT NULL DEFAULT 0,
  skills TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  work_days TEXT[] NOT NULL DEFAULT '{Mon,Tue,Wed,Thu,Fri,Sat}',
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  accepting BOOLEAN NOT NULL DEFAULT true,
  cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL,
  membership_status TEXT NOT NULL DEFAULT 'independent',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  jobs_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.worker_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.worker_profiles TO authenticated;
GRANT ALL ON public.worker_profiles TO service_role;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worker profiles are public" ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "own worker profile insert" ON public.worker_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own worker profile update" ON public.worker_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coop admin updates members" ON public.worker_profiles FOR UPDATE TO authenticated
  USING (cooperative_id IS NOT NULL AND public.is_coop_admin(auth.uid(), cooperative_id))
  WITH CHECK (cooperative_id IS NOT NULL AND public.is_coop_admin(auth.uid(), cooperative_id));

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  slot TEXT NOT NULL DEFAULT '',
  amount INT NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'requested',
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking parties can read" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = worker_id OR (cooperative_id IS NOT NULL AND public.is_coop_admin(auth.uid(), cooperative_id)));
CREATE POLICY "customer creates booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "booking parties can update" ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = worker_id OR (cooperative_id IS NOT NULL AND public.is_coop_admin(auth.uid(), cooperative_id)))
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = worker_id OR (cooperative_id IS NOT NULL AND public.is_coop_admin(auth.uid(), cooperative_id)));

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "customer writes review" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid() AND b.status = 'completed'));

CREATE OR REPLACE FUNCTION public.refresh_worker_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.worker_profiles w
  SET rating = ROUND(COALESCE(s.avg, 0)::numeric, 1), reviews_count = COALESCE(s.cnt, 0)
  FROM (SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM public.reviews WHERE worker_id = NEW.worker_id) s
  WHERE w.user_id = NEW.worker_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER reviews_refresh_rating AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_worker_rating();

CREATE OR REPLACE FUNCTION public.bump_jobs_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.worker_id IS NOT NULL THEN
    UPDATE public.worker_profiles SET jobs_count = jobs_count + 1 WHERE user_id = NEW.worker_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bookings_bump_jobs AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bump_jobs_count();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _name TEXT;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.app_role;
  EXCEPTION WHEN others THEN
    _role := 'customer';
  END;

  INSERT INTO public.profiles (id, full_name, phone, city)
  VALUES (NEW.id, _name, NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'city')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'provider' THEN
    INSERT INTO public.worker_profiles (user_id, full_name, city)
    VALUES (NEW.id, _name, COALESCE(NEW.raw_user_meta_data->>'city', ''))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_bookings_worker ON public.bookings(worker_id);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_coop ON public.bookings(cooperative_id);
CREATE INDEX idx_worker_coop ON public.worker_profiles(cooperative_id);
CREATE INDEX idx_reviews_worker ON public.reviews(worker_id);