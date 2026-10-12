import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Camera, Plus, ShieldCheck, X } from "lucide-react";
import { PageFade, Initials, Pill, SectionHeading, EmptyState } from "@/components/bits";
import { getWorker, updateWorker, categories } from "@/lib/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/provider/profile")({
  head: () => ({
    meta: [
      { title: "My services and profile — TaskHive provider" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Manage your photo, skills, experience, service categories, pricing, portfolio and verification status.",
      },
      { property: "og:title", content: "My services and profile — TaskHive provider" },
      {
        property: "og:description",
        content: "Keep your skills, pricing and verification details up to date.",
      },
    ],
  }),
  component: ProviderProfile,
});

function ProviderProfile() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const workerQuery = useQuery({
    queryKey: ["worker", session?.userId],
    queryFn: () => getWorker(session!.userId),
    enabled: !!session?.userId,
  });
  const worker = workerQuery.data ?? null;

  const [form, setForm] = useState({
    full_name: "",
    trade: "",
    category_id: "",
    city: "",
    area: "",
    rate: 0,
    experience: 0,
    about: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  useEffect(() => {
    if (worker) {
      setForm({
        full_name: worker.full_name,
        trade: worker.trade,
        category_id: worker.category_id,
        city: worker.city,
        area: worker.area,
        rate: worker.rate,
        experience: worker.experience,
        about: worker.about,
      });
      setSkills(worker.skills);
      setLanguages(worker.languages);
    }
  }, [worker]);

  const mutation = useMutation({
    mutationFn: () =>
      updateWorker(worker!.user_id, {
        ...form,
        rate: Number(form.rate),
        experience: Number(form.experience),
        skills,
        languages,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worker", session?.userId] }),
  });

  if (workerQuery.isLoading) {
    return (
      <PageFade className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
        <div className="h-64 animate-pulse rounded-2xl bg-secondary/60" />
      </PageFade>
    );
  }

  if (!worker) {
    return (
      <PageFade>
        <EmptyState
          icon={<ShieldCheck className="size-5" />}
          title="Provider profile not found"
          description="Complete your provider profile setup to manage it here."
        />
      </PageFade>
    );
  }

  return (
    <PageFade className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My services and profile</h1>
        <p className="text-sm text-muted-foreground">
          This is what customers see before they book you.
        </p>
      </div>

      <div className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="relative w-fit">
          <Initials name={form.full_name || worker.full_name} className="size-20 text-xl" />
          <button className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-border bg-card transition-transform hover:scale-110">
            <Camera className="size-4" />
          </button>
        </div>
        <div className="flex-1">
          <p className="flex items-center gap-2 text-xl font-semibold">
            {worker.full_name} {worker.verified ? <ShieldCheck className="size-5 text-success" /> : null}
          </p>
          <p className="text-sm text-muted-foreground">
            {worker.trade} · {worker.experience} years · {worker.area}, {worker.city}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill tone={worker.verified ? "success" : "warning"}>
              <BadgeCheck className="size-3.5" /> {worker.verified ? "Verified provider" : "Verification pending"}
            </Pill>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="surface-card p-5">
            <SectionHeading title="Basic details" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
              <Field label="Trade" value={form.trade} onChange={(v) => setForm((f) => ({ ...f, trade: v }))} />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Category</span>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
              <Field label="Area" value={form.area} onChange={(v) => setForm((f) => ({ ...f, area: v }))} />
              <Field
                label="Experience (years)"
                value={String(form.experience)}
                onChange={(v) => setForm((f) => ({ ...f, experience: Number(v) || 0 }))}
              />
            </div>
          </section>

          <section className="surface-card p-5">
            <SectionHeading title="About me" />
            <textarea
              rows={4}
              value={form.about}
              onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
            />
          </section>

          <section className="surface-card p-5">
            <SectionHeading title="Skills" subtitle="Add the specific work you take up" />
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {s}
                  <button
                    onClick={() => setSkills((k) => k.filter((x) => x !== s))}
                    aria-label={`Remove ${s}`}
                    className="transition-transform hover:scale-125"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={() => {
                  if (!newSkill.trim()) return;
                  setSkills((k) => [...k, newSkill.trim()]);
                  setNewSkill("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <Plus className="size-4" /> Add
              </button>
            </div>
          </section>

          <section className="surface-card p-5">
            <SectionHeading title="Languages" subtitle="Languages you can communicate in" />
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {l}
                  <button
                    onClick={() => setLanguages((k) => k.filter((x) => x !== l))}
                    aria-label={`Remove ${l}`}
                    className="transition-transform hover:scale-125"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language"
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={() => {
                  if (!newLanguage.trim()) return;
                  setLanguages((k) => [...k, newLanguage.trim()]);
                  setNewLanguage("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <Plus className="size-4" /> Add
              </button>
            </div>
          </section>

          <section className="surface-card p-5">
            <SectionHeading title="Pricing" subtitle="Customers see this as your starting price" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Visit charge (₹)"
                value={String(form.rate)}
                onChange={(v) => setForm((f) => ({ ...f, rate: Number(v) || 0 }))}
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface-card p-5">
            <SectionHeading title="Verification" />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Provider verification</span>
                <Pill tone={worker.verified ? "success" : "warning"}>
                  {worker.verified ? "Verified" : "Pending"}
                </Pill>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Membership status</span>
                <Pill tone="primary">{worker.membership_status}</Pill>
              </div>
            </div>
          </section>

          <section className="surface-card p-5">
            <SectionHeading title="Performance" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Rating: {worker.rating.toFixed(1)} ({worker.reviews_count} reviews)</p>
              <p>Jobs completed: {worker.jobs_count}</p>
            </div>
          </section>
        </div>
      </div>
    </PageFade>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
