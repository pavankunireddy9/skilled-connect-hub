import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, Compass, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Initials, PageFade, Pill } from "@/components/bits";
import { StaticMap } from "@/components/static-map";
import { JobDirections } from "@/components/job-directions";
import { distanceKm, formatKm, hasCoords, matchScore } from "@/lib/geo";
import {
  claimBooking,
  formatDate,
  getWorker,
  listOpenRequests,
  rupee,
  type Booking,
} from "@/lib/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/provider/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby jobs — TaskHive provider" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "See customer requests inside the travel radius you set, ranked by distance and skill match, and accept the ones you want.",
      },
      { property: "og:title", content: "Nearby jobs — TaskHive provider" },
      {
        property: "og:description",
        content: "Customer requests inside your service area, ranked by distance and skill match.",
      },
    ],
  }),
  component: Nearby,
});

type Ranked = { booking: Booking; km: number; score: number; sameCategory: boolean };

function Nearby() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<"match" | "distance">("match");

  const workerQuery = useQuery({
    queryKey: ["worker", session?.userId],
    queryFn: () => getWorker(session!.userId),
    enabled: !!session?.userId,
  });
  const worker = workerQuery.data ?? null;

  const requestsQuery = useQuery({
    queryKey: ["open-requests"],
    queryFn: listOpenRequests,
    enabled: !!worker,
  });

  const claim = useMutation({
    mutationFn: (id: string) => claimBooking(id, session!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-requests"] });
      queryClient.invalidateQueries({ queryKey: ["worker-bookings"] });
    },
  });

  const ranked: Ranked[] = useMemo(() => {
    if (!worker || !hasCoords({ lat: worker.base_lat, lng: worker.base_lng })) return [];
    const radius = worker.service_radius_km ?? 10;
    const skills = [worker.trade, worker.category_id, ...(worker.skills ?? [])]
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    return (requestsQuery.data ?? [])
      .filter((b) => hasCoords({ lat: b.lat, lng: b.lng }))
      .map((b) => {
        const km = distanceKm(worker.base_lat!, worker.base_lng!, b.lat!, b.lng!);
        const sameCategory = skills.some(
          (s) => b.service.toLowerCase().includes(s) || s.includes(b.service.toLowerCase()),
        );
        const score = matchScore({
          distanceKm: km,
          radiusKm: radius,
          sameCategory,
          rating: worker.rating,
        });
        return score === null ? null : { booking: b, km, score, sameCategory };
      })
      .filter((r): r is Ranked => r !== null)
      .sort((a, b) => (sort === "match" ? b.score - a.score : a.km - b.km));
  }, [worker, requestsQuery.data, sort]);

  if (workerQuery.isLoading) {
    return (
      <PageFade className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-secondary/60" />
      </PageFade>
    );
  }

  if (!worker) {
    return (
      <PageFade>
        <EmptyState
          icon={<Compass className="size-5" />}
          title="Provider profile not found"
          description="Complete your provider profile to see nearby jobs."
        />
      </PageFade>
    );
  }

  const hasBase = hasCoords({ lat: worker.base_lat, lng: worker.base_lng });

  return (
    <PageFade className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Nearby jobs</h1>
          <p className="text-sm text-muted-foreground">
            {hasBase
              ? `Open requests within ${worker.service_radius_km ?? 10} km of ${worker.base_address || "your base location"}.`
              : "Set your base location to start seeing nearby requests."}
          </p>
        </div>
        {hasBase ? (
          <div className="flex gap-2">
            {(["match", "distance"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200",
                  sort === s
                    ? "border-primary bg-brand-soft text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                Sort by {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!hasBase ? (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="No base location yet"
          description="Add your base location and travel radius under Availability, then jobs around you appear here."
          action={
            <Link
              to="/provider/availability"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Set my service area
            </Link>
          }
        />
      ) : (
        <>
          <StaticMap
            lat={worker.base_lat!}
            lng={worker.base_lng!}
            radiusKm={worker.service_radius_km ?? 10}
            alt="Your service area"
          />

          {requestsQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          ) : ranked.length === 0 ? (
            <EmptyState
              icon={<Navigation className="size-5" />}
              title="No open jobs in your area right now"
              description="Widen your travel radius or check back later — new requests appear here automatically."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {ranked.map((r) => (
                  <motion.div
                    key={r.booking.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.26 }}
                    className="surface-card hover-lift p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Initials name={r.booking.customer_name} className="size-11" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{r.booking.service}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.booking.customer_name} · {formatKm(r.km)}
                        </p>
                      </div>
                      <Pill tone={r.score >= 70 ? "success" : r.score >= 40 ? "warning" : "neutral"}>
                        {r.score}% match
                      </Pill>
                    </div>

                    {r.booking.detail ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {r.booking.detail}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="size-3.5" /> {formatDate(r.booking.scheduled_date)}{" "}
                        · {r.booking.slot}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {r.booking.address}
                      </span>
                    </div>

                    {!r.sameCategory ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Outside your main trade — accept only if you can do this work.
                      </p>
                    ) : null}

                    <JobDirections lat={r.booking.lat} lng={r.booking.lng} address={r.booking.address} originLat={worker.base_lat} originLng={worker.base_lng} />
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="font-display font-semibold">{rupee(r.booking.amount)}</span>
                      <button
                        onClick={() => claim.mutate(r.booking.id)}
                        disabled={claim.isPending}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.04] disabled:opacity-60"
                      >
                        Accept job
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {claim.isError ? (
        <p className="text-sm text-destructive">{(claim.error as Error).message}</p>
      ) : null}
    </PageFade>
  );
}
