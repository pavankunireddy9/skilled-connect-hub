import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { MapPin, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageFade, SectionHeading, EmptyState } from "@/components/bits";
import { LocationPicker, type PlaceLocation } from "@/components/location-picker";
import { StaticMap } from "@/components/static-map";
import { getWorker, updateWorker } from "@/lib/api";
import { useSession } from "@/hooks/use-session";

import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/provider/availability")({
  head: () => ({
    meta: [
      { title: "Availability and service area — TaskHive provider" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Set working days, time slots and the areas you serve, and switch off new jobs when you are busy.",
      },
      { property: "og:title", content: "Availability and service area — TaskHive provider" },
      {
        property: "og:description",
        content: "Control your working days, slots and service areas.",
      },
    ],
  }),
  component: Availability,
});

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_SLOTS = ["Morning", "Afternoon", "Evening"];

function Availability() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const workerQuery = useQuery({
    queryKey: ["worker", session?.userId],
    queryFn: () => getWorker(session!.userId),
    enabled: !!session?.userId,
  });
  const worker = workerQuery.data ?? null;

  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");
  const [accepting, setAccepting] = useState(true);
  const [base, setBase] = useState<PlaceLocation | null>(null);
  const [radius, setRadius] = useState(10);

  useEffect(() => {
    if (worker) {
      setDays(worker.work_days);
      setSlots(worker.time_slots);
      setAreas(worker.service_areas);
      setAccepting(worker.accepting);
      setRadius(worker.service_radius_km ?? 10);
      setBase(
        worker.base_lat != null && worker.base_lng != null
          ? {
              placeId: "",
              address: worker.base_address || "Saved location",
              lat: worker.base_lat,
              lng: worker.base_lng,
            }
          : null,
      );
    }
  }, [worker]);

  const mutation = useMutation({
    mutationFn: (patch: {
      work_days?: string[];
      time_slots?: string[];
      service_areas?: string[];
      accepting?: boolean;
      base_address?: string;
      base_lat?: number | null;
      base_lng?: number | null;
      service_radius_km?: number;
    }) => updateWorker(worker!.user_id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worker", session?.userId] }),
  });


  const toggleDay = (d: string) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    setDays(next);
    mutation.mutate({ work_days: next });
  };

  const toggleSlot = (s: string) => {
    const next = slots.includes(s) ? slots.filter((x) => x !== s) : [...slots, s];
    setSlots(next);
    mutation.mutate({ time_slots: next });
  };

  const toggleAccepting = () => {
    const next = !accepting;
    setAccepting(next);
    mutation.mutate({ accepting: next });
  };

  const addArea = () => {
    if (!newArea.trim()) return;
    const next = [...areas, newArea.trim()];
    setAreas(next);
    setNewArea("");
    mutation.mutate({ service_areas: next });
  };

  const removeArea = (a: string) => {
    const next = areas.filter((x) => x !== a);
    setAreas(next);
    mutation.mutate({ service_areas: next });
  };

  if (workerQuery.isLoading) {
    return (
      <PageFade className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
        <div className="h-40 animate-pulse rounded-2xl bg-secondary/60" />
      </PageFade>
    );
  }

  if (!worker) {
    return (
      <PageFade>
        <EmptyState
          icon={<ShieldCheck className="size-5" />}
          title="Provider profile not found"
          description="Complete your provider profile setup to manage availability."
        />
      </PageFade>
    );
  }

  return (
    <PageFade className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Availability and service area</h1>
        <p className="text-sm text-muted-foreground">
          Requests only reach you during the days, slots and areas you keep switched on.
        </p>
      </div>

      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-medium">Currently accepting jobs</p>
          <p className="text-sm text-muted-foreground">
            {accepting
              ? "Customers can send you new requests right now."
              : "You are hidden from search until you switch this back on."}
          </p>
        </div>
        <button
          onClick={toggleAccepting}
          className={cn(
            "flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300",
            accepting ? "bg-success" : "bg-muted",
          )}
          aria-label="Toggle accepting jobs"
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={cn("block size-6 rounded-full bg-background", accepting && "ml-auto")}
          />
        </button>
      </div>

      <section className="surface-card p-5">
        <SectionHeading title="Working days" />
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={cn(
                "size-12 rounded-xl text-sm font-medium transition-all duration-200",
                days.includes(d)
                  ? "bg-brand-soft text-primary ring-1 ring-primary/40"
                  : "bg-muted text-muted-foreground hover:bg-secondary",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <SectionHeading title="Time slots" subtitle="Pick when you can take jobs" />
        <div className="grid gap-3 sm:grid-cols-3">
          {ALL_SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSlot(s)}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm transition-all duration-200",
                slots.includes(s)
                  ? "border-primary bg-brand-soft text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <SectionHeading
          title="Base location and travel radius"
          subtitle="Jobs inside this circle are shown to you as nearby work"
        />
        <LocationPicker
          value={base}
          onChange={(v) => {
            setBase(v);
            mutation.mutate({
              base_address: v?.address ?? "",
              base_lat: v?.lat ?? null,
              base_lng: v?.lng ?? null,
            });
          }}
          label="Where do you start from?"
          placeholder="Search your area, street or landmark"
        />
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">I can travel up to</span>
            <span className="font-display font-semibold text-primary">{radius} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            onPointerUp={() => mutation.mutate({ service_radius_km: radius })}
            onKeyUp={() => mutation.mutate({ service_radius_km: radius })}
            className="w-full accent-primary"
            aria-label="Service radius in kilometres"
          />
        </div>
        {base ? <StaticMap lat={base.lat} lng={base.lng} radiusKm={radius} alt="Your service area" /> : null}
      </section>

      <section className="surface-card p-5">

        <SectionHeading title="Service areas" subtitle="Where you are willing to travel" />
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service areas added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-primary"
              >
                <MapPin className="size-3.5" /> {a}
                <button
                  onClick={() => removeArea(a)}
                  aria-label={`Remove ${a}`}
                  className="transition-transform hover:scale-125"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <input
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            placeholder="Add an area"
            className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button
            onClick={addArea}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>
      </section>
    </PageFade>
  );
}
