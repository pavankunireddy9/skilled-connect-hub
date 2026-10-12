import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CalendarCheck, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Initials, PageFade, Pill } from "@/components/bits";
import {
  createReview,
  formatDate,
  listCustomerBookings,
  listWorkers,
  rupee,
  statusLabel,
  updateBooking,
  type BookingStatus,
} from "@/lib/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/customer/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — TaskHive" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Track upcoming, active and completed service bookings, view job details and rate the workers you hired.",
      },
      { property: "og:title", content: "My bookings — TaskHive" },
      {
        property: "og:description",
        content: "Track your service bookings and rate completed jobs.",
      },
    ],
  }),
  component: CustomerBookings,
});

const tabs: { id: string; label: string; match: BookingStatus[] }[] = [
  { id: "upcoming", label: "Upcoming", match: ["requested", "accepted"] },
  { id: "active", label: "Active", match: ["in_progress"] },
  { id: "completed", label: "Completed", match: ["completed"] },
  { id: "cancelled", label: "Cancelled", match: ["cancelled"] },
];

const tone: Record<BookingStatus, "primary" | "success" | "warning" | "neutral" | "danger"> = {
  requested: "warning",
  accepted: "primary",
  in_progress: "primary",
  completed: "success",
  cancelled: "danger",
};

function CustomerBookings() {
  const { data: session } = useSession();
  const [tab, setTab] = useState(tabs[0]!);
  const [rated, setRated] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["customer-bookings", session?.userId],
    queryFn: () => listCustomerBookings(session!.userId),
    enabled: !!session?.userId,
  });

  const { data: workers } = useQuery({
    queryKey: ["workers"],
    queryFn: listWorkers,
  });

  const workerMap = useMemo(() => {
    const map = new Map<string, { full_name: string; trade: string }>();
    for (const w of workers ?? []) map.set(w.user_id, { full_name: w.full_name, trade: w.trade });
    return map;
  }, [workers]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateBooking(id, { status: "cancelled" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-bookings", session?.userId] }),
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { bookingId: string; workerId: string; service: string; rating: number }) => {
      if (!session) throw new Error("Not signed in");
      return createReview({
        booking_id: input.bookingId,
        worker_id: input.workerId,
        customer_id: session.userId,
        customer_name: session.fullName,
        rating: input.rating,
        service: input.service,
        comment: "",
      });
    },
    onSuccess: (_data, variables) => {
      setRated((r) => ({ ...r, [variables.bookingId]: variables.rating }));
      queryClient.invalidateQueries({ queryKey: ["worker-reviews", variables.workerId] });
    },
  });

  const list = (bookings ?? []).filter((b) => tab.match.includes(b.status));

  return (
    <PageFade className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My bookings</h1>
        <p className="text-sm text-muted-foreground">Everything you have booked on TaskHive</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t)}
            className="relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
          >
            {tab.id === t.id ? (
              <motion.span
                layoutId="cust-tab"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
              />
            ) : null}
            <span className={cn("relative", tab.id === t.id ? "text-foreground" : "text-muted-foreground")}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface-card h-32 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="size-5" />}
          title={`No ${tab.label.toLowerCase()} bookings`}
          description="When you book a service it will appear here with its live status."
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {list.map((b) => {
              const w = b.worker_id ? workerMap.get(b.worker_id) : undefined;
              const canCancel = b.status === "requested" || b.status === "accepted";
              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="surface-card hover-lift p-5"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <Initials name={w?.full_name ?? "Worker"} className="size-12" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{b.service}</p>
                        <Pill tone={tone[b.status]}>{statusLabel[b.status]}</Pill>
                        <span className="text-xs text-muted-foreground">#{b.id.slice(0, 8)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {w?.full_name ?? "Unassigned"} {w?.trade ? `· ${w.trade}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{b.detail}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="size-3.5" /> {formatDate(b.scheduled_date)}, {b.slot}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" /> {b.address}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-semibold">{rupee(b.amount)}</p>
                      <p className="text-xs text-muted-foreground">{b.paid ? "Paid" : "Pay after service"}</p>
                    </div>
                  </div>

                  {canCancel ? (
                    <div className="mt-4 flex justify-end border-t border-border pt-4">
                      <button
                        onClick={() => cancelMutation.mutate(b.id)}
                        disabled={cancelMutation.isPending}
                        className="rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        Cancel booking
                      </button>
                    </div>
                  ) : null}

                  {b.status === "completed" ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                      <span className="text-sm text-muted-foreground">Rate this service</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() =>
                            b.worker_id &&
                            reviewMutation.mutate({
                              bookingId: b.id,
                              workerId: b.worker_id,
                              service: b.service,
                              rating: n,
                            })
                          }
                          disabled={!!rated[b.id] || reviewMutation.isPending}
                          className="transition-transform duration-150 hover:scale-125 disabled:hover:scale-100"
                          aria-label={`${n} star`}
                        >
                          <Star
                            className={cn(
                              "size-5",
                              (rated[b.id] ?? 0) >= n ? "fill-accent text-accent" : "text-border",
                            )}
                          />
                        </button>
                      ))}
                      {rated[b.id] ? (
                        <span className="text-sm text-success">Thanks for the feedback!</span>
                      ) : null}
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageFade>
  );
}
