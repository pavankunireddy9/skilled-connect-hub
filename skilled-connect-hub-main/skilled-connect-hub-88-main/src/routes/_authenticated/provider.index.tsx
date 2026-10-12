import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CalendarCheck,
  ClipboardList,
  IndianRupee,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";
import { PageFade, Reveal, SectionHeading, StatCard, Pill, EmptyState } from "@/components/bits";
import { getWorker, listWorkerBookings, updateWorker, rupee, statusLabel } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { JobDirections } from "@/components/job-directions";

export const Route = createFileRoute("/_authenticated/provider/")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — TaskHive" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "See today's jobs, pending requests, earnings and ratings in a single worker dashboard built for skilled service providers.",
      },
      { property: "og:title", content: "Provider dashboard — TaskHive" },
      {
        property: "og:description",
        content: "Today's jobs, pending requests, earnings and ratings at a glance.",
      },
    ],
  }),
  component: ProviderDashboard,
});

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

function ProviderDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const workerQuery = useQuery({
    queryKey: ["worker", session?.userId],
    queryFn: () => getWorker(session!.userId),
    enabled: !!session?.userId,
  });
  const worker = workerQuery.data ?? null;

  const bookingsQuery = useQuery({
    queryKey: ["workerBookings", worker?.user_id],
    queryFn: () => listWorkerBookings(worker!.user_id),
    enabled: !!worker?.user_id,
  });
  const bookings = bookingsQuery.data ?? [];

  const toggleAccepting = useMutation({
    mutationFn: () => updateWorker(worker!.user_id, { accepting: !worker!.accepting }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worker", session?.userId] }),
  });

  const today = bookings.filter((b) => b.scheduled_date === todayStr() && b.status !== "cancelled");
  const pending = bookings.filter((b) => b.status === "requested");
  const completed = bookings.filter((b) => b.status === "completed");
  const start = monthStart();
  const thisMonth = completed
    .filter((b) => new Date(b.created_at) >= start)
    .reduce((sum, b) => sum + b.amount, 0);
  const pendingPayout = completed.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);

  if (!worker && workerQuery.isLoading) {
    return (
      <PageFade className="space-y-8">
        <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      </PageFade>
    );
  }

  if (!worker) {
    return (
      <PageFade>
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="Provider profile not found"
          description="Complete your provider profile setup to see your dashboard."
        />
      </PageFade>
    );
  }

  return (
    <PageFade className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Good morning, {worker.full_name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">
            You have {today.length} jobs today and {pending.length} new request
            {pending.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          onClick={() => toggleAccepting.mutate()}
          className="surface-card flex items-center gap-3 px-4 py-2.5"
        >
          <span className="text-sm font-medium">
            {worker.accepting ? "Accepting jobs" : "Not accepting"}
          </span>
          <span
            className={
              worker.accepting
                ? "flex h-6 w-11 items-center rounded-full bg-success p-0.5"
                : "flex h-6 w-11 items-center rounded-full bg-muted p-0.5"
            }
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={
                worker.accepting
                  ? "ml-auto block size-5 rounded-full bg-background"
                  : "block size-5 rounded-full bg-background"
              }
            />
          </span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Earnings this month"
          value={thisMonth}
          prefix="₹"
          hint="Completed jobs this month"
          icon={<IndianRupee className="size-4" />}
        />
        <StatCard
          label="Jobs completed"
          value={completed.length}
          hint="All time"
          icon={<CalendarCheck className="size-4" />}
          delay={0.05}
        />
        <StatCard
          label="Average rating"
          value={worker.rating}
          decimals={1}
          hint={`${worker.reviews_count} customer reviews`}
          icon={<Star className="size-4" />}
          delay={0.1}
        />
        <StatCard
          label="Pending payout"
          value={pendingPayout}
          prefix="₹"
          hint="Completed but unpaid"
          icon={<TrendingUp className="size-4" />}
          delay={0.15}
        />
      </div>

      <section>
        <SectionHeading
          title="Today's jobs"
          action={
            <Link to="/provider/bookings" className="text-sm font-medium text-primary">
              All bookings
            </Link>
          }
        />
        {today.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-5" />}
            title="Nothing scheduled today"
            description="Keep your availability on so new requests reach you."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {today.map((b, i) => (
              <Reveal key={b.id} delay={i * 0.06}>
                <div className="surface-card hover-lift p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{b.service}</p>
                    <Pill tone={b.status === "in_progress" ? "primary" : "success"}>
                      {statusLabel[b.status]}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{b.customer_name}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> {b.address}
                  </p>
                  <JobDirections lat={b.lat} lng={b.lng} address={b.address} originLat={worker.base_lat} originLng={worker.base_lng} />
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">{b.slot}</span>
                    <span className="font-display font-semibold">{rupee(b.amount)}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Pending requests" />
          {pending.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-5" />}
              title="No new requests"
              description="New customer requests will show up here for you to accept."
            />
          ) : (
            <div className="space-y-3">
              {pending.map((b) => (
                <div key={b.id} className="surface-card p-5">
                  <p className="font-medium">{b.service}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.customer_name} · {b.scheduled_date}, {b.slot}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to="/provider/bookings"
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                    >
                      Review request
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading title="Updates" />
          <div className="border-t border-border py-8 text-sm text-muted-foreground">Your bookings and customer reviews appear as they happen. No new updates right now.</div>
        </section>
      </div>
    </PageFade>
  );
}
