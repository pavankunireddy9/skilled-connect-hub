import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CalendarCheck, ClipboardList, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Initials, PageFade, Pill } from "@/components/bits";
import { getWorker, listWorkerBookings, updateBooking, rupee, statusLabel } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { JobDirections } from "@/components/job-directions";
import type { Booking, BookingStatus } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/provider/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings and jobs — TaskHive provider" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Accept or decline new requests, follow upcoming and active jobs, and review completed work history.",
      },
      { property: "og:title", content: "Bookings and jobs — TaskHive provider" },
      {
        property: "og:description",
        content: "Manage new requests, active jobs and completed work in one place.",
      },
    ],
  }),
  component: ProviderBookings,
});

const tabs: { id: string; label: string; match: BookingStatus[] }[] = [
  { id: "new", label: "New requests", match: ["requested"] },
  { id: "upcoming", label: "Upcoming", match: ["accepted"] },
  { id: "active", label: "Active", match: ["in_progress"] },
  { id: "done", label: "History", match: ["completed", "cancelled"] },
];

const tone: Record<BookingStatus, "primary" | "success" | "warning" | "neutral" | "danger"> = {
  requested: "warning",
  accepted: "primary",
  in_progress: "primary",
  completed: "success",
  cancelled: "danger",
};

function ProviderBookings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(tabs[0]!);

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
  const list: Booking[] = bookingsQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBooking(id, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workerBookings", worker?.user_id] }),
  });

  const shown = list.filter((b) => tab.match.includes(b.status));

  return (
    <PageFade className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings and jobs</h1>
        <p className="text-sm text-muted-foreground">
          Respond to requests and keep customers updated as work progresses.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
        {tabs.map((t) => {
          const count = list.filter((b) => t.match.includes(b.status)).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t)}
              className="relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
            >
              {tab.id === t.id ? (
                <motion.span
                  layoutId="prov-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className="absolute inset-0 rounded-lg bg-card shadow-sm"
                />
              ) : null}
              <span
                className={cn(
                  "relative",
                  tab.id === t.id ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t.label} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title={`Nothing in ${tab.label.toLowerCase()}`}
          description="Requests and jobs move through these tabs as their status changes."
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {shown.map((b) => (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="surface-card p-5"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <Initials name={b.customer_name} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{b.service}</p>
                      <Pill tone={tone[b.status]}>{statusLabel[b.status]}</Pill>
                      <span className="text-xs text-muted-foreground">#{b.id.slice(0, 8)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{b.customer_name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{b.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="size-3.5" /> {b.scheduled_date}, {b.slot}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {b.address}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-semibold">{rupee(b.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.paid ? "Payment received" : "Collect after service"}
                    </p>
                  </div>
                </div>

                <JobDirections lat={b.lat} lng={b.lng} address={b.address} originLat={worker?.base_lat} originLng={worker?.base_lng} />
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {b.status === "requested" ? (
                    <>
                      <button
                        onClick={() => mutation.mutate({ id: b.id, status: "accepted" })}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                      >
                        Accept request
                      </button>
                      <button
                        onClick={() => mutation.mutate({ id: b.id, status: "cancelled" })}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        Decline
                      </button>
                    </>
                  ) : null}
                  {b.status === "accepted" ? (
                    <button
                      onClick={() => mutation.mutate({ id: b.id, status: "in_progress" })}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                    >
                      Start job
                    </button>
                  ) : null}
                  {b.status === "in_progress" ? (
                    <button
                      onClick={() => mutation.mutate({ id: b.id, status: "completed" })}
                      className="rounded-xl bg-success px-4 py-2 text-sm font-medium text-success-foreground transition-transform hover:scale-[1.03]"
                    >
                      Mark as completed
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageFade>
  );
}
