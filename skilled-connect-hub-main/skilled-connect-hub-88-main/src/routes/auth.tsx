import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Briefcase, Home, Loader2, MailCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageFade } from "@/components/bits";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { AppRole } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or register — TaskHive" },
      {
        name: "description",
        content:
          "Join TaskHive as a customer looking for help, or as an independent skilled service provider.",
      },
      { property: "og:title", content: "Sign in or register — TaskHive" },
      {
        property: "og:description",
        content: "Choose your role and get started on TaskHive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const roleOptions = [
  {
    id: "customer",
    label: "Customer",
    desc: "I need a service at home or work",
    icon: <Home className="size-4" />,
  },
  {
    id: "provider",
    label: "Service provider",
    desc: "I offer a skilled service",
    icon: <Briefcase className="size-4" />,
  },
] as const;

export const homeForRole = (roles: AppRole[]) =>
  roles.includes("provider") ? "/provider" : "/customer";


function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [role, setRole] = useState<AppRole>("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const selected = roleOptions.find((r) => r.id === role)!;

  const goHome = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    navigate({ to: sessionStorage.getItem("taskhive-search") ? "/customer/browse" : homeForRole((roles ?? []).map((r) => r.role)) });
  };

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goHome();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await goHome();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, phone, city, role },
          },
        });
        if (err) throw err;
        if (data.session) await goHome();
        else setCheckEmail(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in did not work. Please try again.");
      return;
    }
    if (result.redirected) return;
    await goHome();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="absolute right-5 top-5 z-20"><ThemeToggle /></div>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">

        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15 font-display text-sm font-bold">
            <Wrench className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">TaskHive</span>
        </Link>
        <div className="relative">
          <h2 className="max-w-sm text-4xl font-bold leading-tight">
            Skilled work deserves a proper system.
          </h2>
          <p className="mt-4 max-w-sm text-sm opacity-85">
            Service providers and customers — coordinated in one place, with verification, bookings
            and earnings you can see.
          </p>
        </div>
        <p className="relative text-xs opacity-70">One account, two ways to work.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <PageFade className="w-full max-w-md">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>

          {checkEmail ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <MailCheck className="mx-auto size-8 text-primary" />
              <h1 className="mt-3 text-xl font-bold">Confirm your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Open it
                to activate your account, then sign in.
              </p>
              <button
                onClick={() => {
                  setCheckEmail(false);
                  setMode("signin");
                }}
                className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 rounded-xl bg-secondary p-1">
                {(["signin", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="relative rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    {mode === m ? (
                      <motion.span
                        layoutId="auth-tab"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-card shadow-sm"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative",
                        mode === m ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {m === "signin" ? "Sign in" : "Register"}
                    </span>
                  </button>
                ))}
              </div>

              <h1 className="text-2xl font-bold">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to continue to your dashboard."
                  : "Tell us who you are and we will set up the right workspace."}
              </p>

              <AnimatePresence mode="wait">
                {mode === "register" ? (
                  <motion.div
                    key="roles"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 space-y-2">
                      {roleOptions.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                            role === r.id
                              ? "border-primary bg-brand-soft"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <span className="grid size-9 place-items-center rounded-lg bg-card text-primary">
                            {r.icon}
                          </span>
                          <span>
                            <span className="block text-sm font-medium">{r.label}</span>
                            <span className="block text-xs text-muted-foreground">{r.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                {mode === "register" ? (
                  <>
                    <Field
                      label="Full name"
                      placeholder="Ramesh Yadav"
                      value={name}
                      onChange={setName}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Mobile number"
                        placeholder="+91 98490 00000"
                        value={phone}
                        onChange={setPhone}
                      />
                      <Field label="City" placeholder="Hyderabad" value={city} onChange={setCity} />
                    </div>
                  </>
                ) : null}
                <Field
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                />
                <Field
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                />

                {error ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:scale-[1.02] disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {mode === "signin" ? "Sign in" : `Continue as ${selected.label}`}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                onClick={google}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <GoogleMark /> Continue with Google
              </button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Google sign-in creates a customer account. Register with email above to join as a
                service provider.
              </p>
            </>
          )}
        </PageFade>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6v-3.1h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"
      />
    </svg>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-shadow duration-200 focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
