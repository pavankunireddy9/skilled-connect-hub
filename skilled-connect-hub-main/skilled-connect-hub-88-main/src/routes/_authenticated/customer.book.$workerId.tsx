import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, CircleCheckBig } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Initials, PageFade } from "@/components/bits";
import { LocationPicker, type PlaceLocation } from "@/components/location-picker";
import { StaticMap } from "@/components/static-map";
import { distanceKm, formatKm, hasCoords } from "@/lib/geo";
import { createBooking, getWorker, rupee } from "@/lib/api";
import { useSession } from "@/hooks/use-session";


export const Route = createFileRoute("/_authenticated/customer/book/$workerId")({
  head: () => ({
    meta: [
      { title: "Book a worker — TaskHive" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content: "Send a service request with job details, address and a preferred time slot.",
      },
      { property: "og:title", content: "Book a worker — TaskHive" },
      {
        property: "og:description",
        content: "Send a service request with job details, address and a preferred time slot.",
      },
    ],
  }),
  component: BookPage,
});

const dates = [
  { label: "Today", value: () => new Date() },
  { label: "Tomorrow", value: () => new Date(Date.now() + 86400000) },
  { label: "In 2 days", value: () => new Date(Date.now() + 2 * 86400000) },
  { label: "In 3 days", value: () => new Date(Date.now() + 3 * 86400000) },
];

const defaultSlots = ["Morning (9am - 12pm)", "Afternoon (12pm - 4pm)", "Evening (4pm - 7pm)"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function BookPage() {
  const { workerId } = Route.useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => getWorker(workerId),
  });

  const [step, setStep] = useState(1);
  const [dateIdx, setDateIdx] = useState(0);
  const [slot, setSlot] = useState(defaultSlots[0]!);
  const [service, setService] = useState<string | undefined>(undefined);
  const [detail, setDetail] = useState("");
  const [place, setPlace] = useState<PlaceLocation | null>(null);

  const slots = worker?.time_slots && worker.time_slots.length > 0 ? worker.time_slots : defaultSlots;
  const activeService = service ?? worker?.skills?.[0] ?? "";

  const providerDistance =
    place && worker && hasCoords({ lat: worker.base_lat, lng: worker.base_lng })
      ? distanceKm(place.lat, place.lng, worker.base_lat!, worker.base_lng!)
      : null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!worker || !session) throw new Error("Missing worker or session");
      if (!place) throw new Error("Pick the service location first");
      return createBooking({
        customer_id: session.userId,
        customer_name: session.fullName,
        worker_id: worker.user_id,
        cooperative_id: null,
        service: activeService,
        detail,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        place_id: place.placeId,
        scheduled_date: toISODate(dates[dateIdx]!.value()),
        slot,
        amount: worker.rate,
        status: "requested",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      setStep(3);
    },
  });


  if (isLoading) {
    return (
      <PageFade className="mx-auto max-w-3xl space-y-6">
        <div className="surface-card h-96 animate-pulse" />
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

  return (
    <PageFade className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/customer/worker/$workerId"
        params={{ workerId: worker.user_id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to profile
      </Link>

      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {step > s ? <Check className="size-4" /> : s}
            </span>
            {s < 3 ? (
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="block h-full bg-primary"
                  initial={false}
                  animate={{ width: step > s ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
          <Initials name={worker.full_name} className="size-12" />
          <div>
            <p className="font-medium">{worker.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {worker.trade} · from {rupee(worker.rate)}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">What work do you need?</h2>
              <div className="flex flex-wrap gap-2">
                {(worker.skills ?? []).map((s) => (
                  <button
                    key={s}
                    onClick={() => setService(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      activeService === s
                        ? "border-primary bg-brand-soft text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Describe the job</span>
                <textarea
                  rows={4}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Describe what needs to be done…"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
                />
              </label>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">Where and when?</h2>
              <LocationPicker
                value={place}
                onChange={setPlace}
                label="Service address"
                placeholder="Search your area, street or landmark"
              />
              {place ? (
                <>
                  <StaticMap lat={place.lat} lng={place.lng} alt="Map of the service address" />
                  {providerDistance !== null ? (
                    <p className="text-sm text-muted-foreground">
                      About <span className="font-medium text-foreground">{formatKm(providerDistance)}</span>{" "}
                      from {worker.full_name}
                      {providerDistance > worker.service_radius_km
                        ? " — outside their usual service area, so they may decline."
                        : " — within their service area."}
                    </p>
                  ) : null}
                </>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium">Preferred date</p>
                <div className="flex flex-wrap gap-2">
                  {dates.map((d, i) => (
                    <button
                      key={d.label}
                      onClick={() => setDateIdx(i)}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 text-sm transition-all duration-200",
                        dateIdx === i
                          ? "border-primary bg-brand-soft text-primary"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Time slot</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
                        slot === s
                          ? "border-primary bg-brand-soft text-primary"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {mutation.isError ? (
                <p className="text-sm text-destructive">
                  {(mutation.error as Error).message || "Could not send the request. Try again."}
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div
              key="s3"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-4 text-center"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success"
              >
                <CircleCheckBig className="size-8" />
              </motion.span>
              <h2 className="mt-4 text-xl font-semibold">Request sent to {worker.full_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeService} · {dates[dateIdx]!.label}, {slot}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You will get a confirmation once the worker accepts.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Link
                  to="/customer/bookings"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  View my bookings
                </Link>
                <Link
                  to="/customer/browse"
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Book another
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {step < 3 ? (
          <div className="mt-6 flex justify-between border-t border-border pt-4">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={() => (step === 2 ? mutation.mutate() : setStep((s) => s + 1))}
              disabled={mutation.isPending || (step === 2 && !place)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.03] disabled:opacity-60"
            >
              {step === 2 ? (mutation.isPending ? "Sending…" : "Send request") : "Continue"}
            </button>
          </div>
        ) : null}
      </div>
    </PageFade>
  );
}
