import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Star, TrendingUp, Wallet } from "lucide-react";
import {
  PageFade,
  Reveal,
  SectionHeading,
  StatCard,
  Pill,
  Initials,
  Stars,
  EmptyState,
} from "@/components/bits";
import { getWorker, listWorkerBookings, listWorkerReviews, rupee, formatDate } from "@/lib/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/provider/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings and reviews — TaskHive provider" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Track service income, payout status, customer ratings and performance history as a skilled service provider.",
      },
      { property: "og:title", content: "Earnings and reviews — TaskHive provider" },
      {
        property: "og:description",
        content: "See your income, pending payouts and customer feedback.",
      },
    ],
  }),
  component: Earnings,
});

function monthKey(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function Earnings() {
  const { data: session } = useSession();

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

  const reviewsQuery = useQuery({
    queryKey: ["workerReviews", worker?.user_id],
    queryFn: () => listWorkerReviews(worker!.user_id),
    enabled: !!worker?.user_id,
  });
  const reviews = reviewsQuery.data ?? [];

  const completed = bookings.filter((b) => b.status === "completed");

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = completed
    .filter((b) => new Date(b.created_at) >= thisMonthStart)
    .reduce((sum, b) => sum + b.amount, 0);
  const lastMonth = completed
    .filter((b) => new Date(b.created_at) >= lastMonthStart && new Date(b.created_at) < thisMonthStart)
    .reduce((sum, b) => sum + b.amount, 0);
  const pending = completed.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);

  const monthly: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const amount = completed
      .filter((b) => new Date(b.created_at) >= d && new Date(b.created_at) < next)
      .reduce((sum, b) => sum + b.amount, 0);
    monthly.push({ month: monthKey(d), amount });
  }
  const max = Math.max(1, ...monthly.map((m) => m.amount));

  if (workerQuery.isLoading) {
    return (
      <PageFade className="space-y-8">
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
          icon={<Wallet className="size-5" />}
          title="Provider profile not found"
          description="Complete your provider profile setup to see earnings."
        />
      </PageFade>
    );
  }

  return (
    <PageFade className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Earnings and reviews</h1>
        <p className="text-sm text-muted-foreground">
          Your income, payouts and what customers say about your work.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="This month" value={thisMonth} prefix="₹" hint="Completed jobs" icon={<IndianRupee className="size-4" />} />
        <StatCard label="Last month" value={lastMonth} prefix="₹" hint="Completed jobs" icon={<TrendingUp className="size-4" />} delay={0.05} />
        <StatCard label="Pending payout" value={pending} prefix="₹" hint="Completed but unpaid" icon={<Wallet className="size-4" />} delay={0.1} />
        <StatCard label="Average rating" value={worker.rating} decimals={1} hint={`${worker.reviews_count} reviews`} icon={<Star className="size-4" />} delay={0.15} />
      </div>

      <section className="surface-card p-5">
        <SectionHeading title="Monthly income" subtitle="Last six months" />
        <div className="flex h-52 items-end gap-3">
          {monthly.map((m, i) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">{rupee(m.amount)}</span>
              <Reveal delay={i * 0.05} className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-xl bg-primary/85 transition-all duration-500 hover:bg-primary"
                  style={{ height: `${(m.amount / max) * 100}%` }}
                />
              </Reveal>
              <span className="text-xs font-medium">{m.month}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Completed jobs" />
        {completed.length === 0 ? (
          <EmptyState
            icon={<IndianRupee className="size-5" />}
            title="No completed jobs yet"
            description="Payment details for your completed jobs will show up here."
          />
        ) : (
          <div className="surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {completed.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-3 font-medium">{b.service}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(b.scheduled_date)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{b.customer_name}</td>
                    <td className="px-5 py-3 font-medium">{rupee(b.amount)}</td>
                    <td className="px-5 py-3">
                      <Pill tone={b.paid ? "success" : "warning"}>{b.paid ? "Paid" : "Pending"}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="Recent reviews" />
        {reviews.length === 0 ? (
          <EmptyState
            icon={<Star className="size-5" />}
            title="No reviews yet"
            description="Customer reviews will appear here after completed jobs."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.06}>
                <div className="surface-card h-full p-5">
                  <div className="flex items-center gap-3">
                    <Initials name={r.customer_name} />
                    <div>
                      <p className="text-sm font-medium">{r.customer_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Stars rating={r.rating} /> {r.service} · {formatDate(r.created_at.slice(0, 10))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PageFade>
  );
}
