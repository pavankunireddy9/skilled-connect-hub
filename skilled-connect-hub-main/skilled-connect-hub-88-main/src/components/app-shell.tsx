import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Menu, X, LogOut, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Initials } from "@/components/bits";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = { label: string; to: string; icon: ReactNode };

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
        <Wrench className="size-4" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">TaskHive</span>
    </Link>
  );
}

export function AppShell({
  items,
  user,
  role,
  children,
}: {
  items: NavItem[];
  user: { name: string; meta: string };
  role: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const isActive = (to: string) =>
    to === items[0]!.to ? path === to : path.startsWith(to);

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive(item.to)
              ? "bg-brand-soft text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <span className="transition-transform duration-200 group-hover:scale-110">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <button
            className="grid size-9 place-items-center rounded-xl border border-border lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
          <Brand />
          <span className="ml-1 hidden rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground md:inline">
            {role}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-xl border border-border py-1 pl-1 pr-3">
              <Initials name={user.name} className="size-8" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{user.meta}</span>
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="grid size-9 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="sticky top-22 hidden h-[calc(100vh-7rem)] w-60 shrink-0 lg:block">
          {nav()}
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card p-4 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setOpen(false)}
                  className="grid size-9 place-items-center rounded-xl border border-border"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              {nav(() => setOpen(false))}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] transition-colors",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.icon}
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
