import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Initials, PageFade, Pill, Stars } from "@/components/bits";
import { categories, listWorkers, rupee } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/customer/browse")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => {
    const category = search["category"];
    return typeof category === "string" ? { category } : {};
  },
  head: () => ({
    meta: [
      { title: "Browse service providers — TaskHive" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Filter skilled workers by trade, city, rating and availability, and open a full profile before booking.",
      },
      { property: "og:title", content: "Browse service providers — TaskHive" },
      {
        property: "og:description",
        content: "Compare local service providers by trade, rating, price and availability.",
      },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { category } = Route.useSearch();
  const [cat, setCat] = useState<string | undefined>(category);
  const [query, setQuery] = useState("");
  useEffect(() => { const saved = sessionStorage.getItem("taskhive-search"); if (saved) { setQuery(saved); sessionStorage.removeItem("taskhive-search"); } }, []);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: listWorkers,
  });

  const results = useMemo(
    () =>
      (workers ?? []).filter((w) => {
        if (cat && w.category_id !== cat) return false;
        if (onlyVerified && !w.verified) return false;
        if (onlyAvailable && !w.accepting) return false;
        if (w.rating < minRating) return false;
        const q = query.trim().toLowerCase();
        if (
          q &&
          !`${w.full_name} ${w.trade} ${w.area} ${w.city} ${(w.skills ?? []).join(" ")}`
            .toLowerCase()
            .includes(q)
        )
          return false;
        return true;
      }),
    [workers, cat, query, onlyVerified, onlyAvailable, minRating],
  );

  return (
    <PageFade className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse providers</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "provider matches" : "providers match"} your filters
        </p>
      </div>

      <div className="surface-card space-y-4 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, skill or area"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={!cat} onClick={() => setCat(undefined)}>
            All trades
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <FilterChip active={onlyVerified} onClick={() => setOnlyVerified((v) => !v)}>
            Verified only
          </FilterChip>
          <FilterChip active={onlyAvailable} onClick={() => setOnlyAvailable((v) => !v)}>
            Available now
          </FilterChip>
          <FilterChip active={minRating === 4.5} onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}>
            4.5★ and above
          </FilterChip>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface-card h-48 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No providers match these filters"
          description="Try removing a filter or searching for a different trade or area."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {results.map((w) => (
              <motion.div
                key={w.user_id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="surface-card hover-lift flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <Initials name={w.full_name} className="size-12" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-medium">
                        {w.full_name}
                        {w.verified ? <ShieldCheck className="size-4 text-success" /> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {w.trade} · {w.area}, {w.city} · {w.experience} yrs
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Stars rating={w.rating} /> {w.rating} ({w.reviews_count} reviews)
                      </div>
                    </div>
                    <Pill tone={w.accepting ? "success" : "neutral"}>
                      {w.accepting ? "Available" : "Busy"}
                    </Pill>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {w.verified ? "Verified service provider" : "Service provider"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(w.skills ?? []).slice(0, 3).map((s) => (
                      <Pill key={s}>{s}</Pill>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-display text-lg font-semibold">
                      {rupee(w.rate)}
                      <span className="text-xs font-normal text-muted-foreground">/visit</span>
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to="/customer/worker/$workerId"
                        params={{ workerId: w.user_id }}
                        className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        View profile
                      </Link>
                      <Link
                        to="/customer/book/$workerId"
                        params={{ workerId: w.user_id }}
                        className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.03]"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageFade>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-primary bg-brand-soft text-primary"
          : "border-border text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
