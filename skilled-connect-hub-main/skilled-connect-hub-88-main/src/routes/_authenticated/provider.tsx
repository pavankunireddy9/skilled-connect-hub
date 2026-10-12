import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, Compass, LayoutDashboard, UserRound, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/provider")({
  component: ProviderLayout,
});

function ProviderLayout() {
  const { data: session } = useSession();

  return (
    <AppShell
      role="Service provider"
      user={{ name: session?.fullName ?? "Provider", meta: "Service provider" }}
      items={[
        { label: "Dashboard", to: "/provider", icon: <LayoutDashboard className="size-4" /> },
        { label: "Nearby jobs", to: "/provider/nearby", icon: <Compass className="size-4" /> },
        { label: "Bookings", to: "/provider/bookings", icon: <ClipboardList className="size-4" /> },
        { label: "Availability", to: "/provider/availability", icon: <CalendarClock className="size-4" /> },
        { label: "Earnings", to: "/provider/earnings", icon: <Wallet className="size-4" /> },
        { label: "Profile", to: "/provider/profile", icon: <UserRound className="size-4" /> },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
