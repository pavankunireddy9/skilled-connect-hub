import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Languages, MapPin, ShieldCheck } from "lucide-react";
import { EmptyState, Initials, PageFade, Pill, Stars } from "@/components/bits";
import { getWorker, listWorkerReviews, rupee } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/customer/worker/$workerId")({
  head: () => ({
    meta: [
      { title: "Worker profile — TaskHive" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Worker profile on TaskHive." },
      { property: "og:title", content: "Worker profile — TaskHive" },
      { property: "og:description", content: "Worker profile on TaskHive." },
    ],
  }),
  component: WorkerProfile,
});

function WorkerProfile() {
  const { workerId } = Route.useParams();
  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => getWorker(workerId),
  });
  const { data: workerReviews } = useQuery({
    queryKey: ["worker-reviews", workerId],
    queryFn: () => listWorkerReviews(workerId),
    enabled: !!worker,
  });

  if (isLoading) {
    return (
      <PageFade className="space-y-6">
        <div className="surface-card h-40 animate-pulse" />
        <div className="surface-card h-64 animate-pulse" />
      </PageFade>
    );
  }

  if (!worker) {
    return (
      <PageFade>
        <EmptyState title="Worker not found" description="This profile is no longer available." />
      </PageFade>
    );
  }

  const reviews = workerReviews ?? [];

  return (
    <PageFade className="space-y-6">
      <Link
        to="/customer/browse"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to browse
      </Link>

      <div className="surface-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Initials name={worker.full_name} className="size-20 text-xl" />
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {worker.full_name}
              {worker.verified ? <ShieldCheck className="size-5 text-success" /> : null}
            </h1>
            <p className="text-sm text-muted-foreground">
              {worker.trade} · {worker.experience} years experience
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Stars rating={worker.rating} /> {worker.rating} ({worker.reviews_count})
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {worker.area}, {worker.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="size-4" /> {(worker.languages ?? []).join(", ")}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-display text-2xl font-semibold">{rupee(worker.rate)}</p>
            <p className="text-xs text-muted-foreground">starting per visit</p>
            <Link
              to="/customer/book/$workerId"
              params={{ workerId: worker.user_id }}
              className="mt-3 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.03]"
            >
              Request this worker
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="surface-card p-5">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 text-sm text-muted-foreground">{worker.about}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(worker.skills ?? []).map((s) => (
                <Pill key={s} tone="primary">
                  {s}
                </Pill>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <Stat label="Jobs done" value={String(worker.jobs_count)} />
              <Stat label="Rating" value={worker.rating.toFixed(1)} />
              <Stat label="Experience" value={`${worker.experience} yrs`} />
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="text-lg font-semibold">Customer reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                    <Initials name={r.customer_name} />
                    <div>
                      <p className="text-sm font-medium">{r.customer_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Stars rating={r.rating} /> {r.service} · {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-4 text-primary" /> Availability
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(worker.work_days ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No availability set yet.</p>
              ) : (
                (worker.work_days ?? []).map((d) => (
                  <span
                    key={d}
                    className="grid size-9 place-items-center rounded-lg bg-brand-soft text-xs font-medium text-primary"
                  >
                    {d}
                  </span>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2">
              {(worker.time_slots ?? []).map((s) => (
                <div key={s} className="rounded-lg border border-border px-3 py-2 text-sm">
                  {s}
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="text-lg font-semibold">Service areas</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(worker.service_areas ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Not specified.</p>
              ) : (
                (worker.service_areas ?? []).map((a) => <Pill key={a}>{a}</Pill>)
              )}
            </div>
            {worker.verified ? (
              <p className="mt-4 rounded-xl bg-brand-soft p-3 text-xs text-primary">
                Identity and skills verified
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </PageFade>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
