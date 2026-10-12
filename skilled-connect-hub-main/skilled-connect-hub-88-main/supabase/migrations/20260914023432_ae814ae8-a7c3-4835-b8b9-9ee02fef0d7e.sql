ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS base_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS base_lat double precision,
  ADD COLUMN IF NOT EXISTS base_lng double precision,
  ADD COLUMN IF NOT EXISTS service_radius_km integer NOT NULL DEFAULT 10;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS place_id text;

CREATE INDEX IF NOT EXISTS bookings_latlng_idx ON public.bookings (lat, lng);
CREATE INDEX IF NOT EXISTS worker_profiles_latlng_idx ON public.worker_profiles (base_lat, base_lng);

CREATE OR REPLACE FUNCTION public.distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 2 * 6371 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians(lng2 - lng1) / 2), 2)
    )
  )
$$;

GRANT EXECUTE ON FUNCTION public.distance_km(double precision, double precision, double precision, double precision) TO anon, authenticated, service_role;