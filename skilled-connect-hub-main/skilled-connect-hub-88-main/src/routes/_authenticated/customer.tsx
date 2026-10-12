import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CalendarCheck, LayoutGrid, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/customer")({
  component: CustomerLayout,
});

function CustomerLayout() {
  const { data: session } = useSession();

  return (
    <AppShell
      role="Customer"
      user={{ name: session?.fullName || "Customer", meta: session?.city || "" }}
      items={[
        { label: "Home", to: "/customer", icon: <LayoutGrid className="size-4" /> },
        { label: "Browse providers", to: "/customer/browse", icon: <Search className="size-4" /> },
        { label: "My bookings", to: "/customer/bookings", icon: <CalendarCheck className="size-4" /> },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
