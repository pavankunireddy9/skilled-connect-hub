import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ArrowRight, MapPin, Search, ShieldCheck, Wrench } from "lucide-react";
import { PageFade, Reveal, SectionHeading, Initials, Pill, Stars, EmptyState } from "@/components/bits";
import { categories, listWorkers, rupee } from "@/lib/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/customer/")({
  head: () => ({
    meta: [
      { title: "Find a skilled worker near you — TaskHive" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Search plumbers, electricians, carpenters, cleaners and more. Request a service provider in your area.",
      },
      { property: "og:title", content: "Find a skilled worker near you — TaskHive" },
      {
        property: "og:description",
        content: "Browse local service providers and request a service slot.",
      },
    ],
  }),
  component: CustomerHome,
});

function CustomerHome() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: listWorkers,
  });

  return (
    <PageFade className="space-y-10">
      <section className="surface-card relative overflow-hidden p-6 sm:p-8">
        <div className="relative">
          <p className="text-sm text-muted-foreground">Namaste, {session?.fullName?.split(" ")[0] || "there"}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">What do you need help with today?</h1>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { sessionStorage.setItem("taskhive-search", search); navigate({ to: "/customer/browse" }); } }}
                placeholder="Search for a plumber, electrician, cleaner…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {session?.city || "Your city"}
            </div>
            <Link
              to="/customer/browse"
              onClick={() => sessionStorage.setItem("taskhive-search", search)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.02]"
            >
              Search <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Services"
          subtitle="Explore service categories"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.04}>
              <Link
                to="/customer/browse"
                search={{ category: c.id }}
                className="surface-card hover-lift block p-4"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-primary">
                  <Wrench className="size-4" />
                </span>
                <p className="mt-3 text-sm font-medium">{c.name}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Service providers"
          action={
            <Link to="/customer/browse" className="text-sm font-medium text-primary">
              View all
            </Link>
          }
        />
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="surface-card h-48 animate-pulse" />
            ))}
          </div>
        ) : !workers || workers.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="No providers yet"
            description="Service providers will appear here once they have joined TaskHive."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workers.slice(0, 6).map((w, i) => (
              <Reveal key={w.user_id} delay={i * 0.05}>
                <Link
                  to="/customer/worker/$workerId"
                  params={{ workerId: w.user_id }}
                  className="surface-card hover-lift flex h-full flex-col p-5"
                >
                  <div className="flex items-center gap-3">
                    <Initials name={w.full_name} className="size-12" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">
                        {w.full_name}
                        {w.verified ? <ShieldCheck className="size-4 text-success" /> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {w.trade} · {w.area}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Stars rating={w.rating} />
                    {w.rating} ({w.reviews_count})
                  </div>
                  <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{w.about}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display font-semibold">{rupee(w.rate)}<span className="text-xs font-normal text-muted-foreground">/visit</span></span>
                    <Pill tone={w.accepting ? "success" : "neutral"}>
                      {w.accepting ? "Available" : "Busy"}
                    </Pill>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PageFade>
  );
}
