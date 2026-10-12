import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type WorkerProfile = Database["public"]["Tables"]["worker_profiles"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type BookingStatus = Database["public"]["Enums"]["booking_status"];

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ---------------- workers ---------------- */

export async function listWorkers(): Promise<WorkerProfile[]> {
  return unwrap(
    await supabase
      .from("worker_profiles")
      .select("*")
      .order("rating", { ascending: false }),
  );
}

export async function getWorker(id: string): Promise<WorkerProfile | null> {
  const { data, error } = await supabase
    .from("worker_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateWorker(id: string, patch: Partial<WorkerProfile>) {
  const { error } = await supabase.from("worker_profiles").update(patch).eq("user_id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- bookings ---------------- */



export async function createBooking(input: Database["public"]["Tables"]["bookings"]["Insert"]) {
  const { data, error } = await supabase.from("bookings").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listCustomerBookings(customerId: string): Promise<Booking[]> {
  return unwrap(
    await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  );
}

export async function listWorkerBookings(workerId: string): Promise<Booking[]> {
  return unwrap(
    await supabase
      .from("bookings")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false }),
  );
}

/** Unassigned requests a provider could pick up (filtered by distance in the UI). */
export async function listOpenRequests(): Promise<Booking[]> {
  return unwrap(
    await supabase
      .from("bookings")
      .select("*")
      .is("worker_id", null)
      .eq("status", "requested")
      .order("created_at", { ascending: false }),
  );
}

/** A provider takes an open request as their own job. */
export async function claimBooking(id: string, workerId: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ worker_id: workerId, status: "accepted" })
    .eq("id", id)
    .is("worker_id", null);
  if (error) throw new Error(error.message);
}

export async function updateBooking(id: string, patch: Partial<Booking>) {
  const { error } = await supabase.from("bookings").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}


/* ---------------- reviews ---------------- */

export async function listWorkerReviews(workerId: string): Promise<Review[]> {
  return unwrap(
    await supabase
      .from("reviews")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false }),
  );
}

export async function createReview(input: Database["public"]["Tables"]["reviews"]["Insert"]) {
  const { error } = await supabase.from("reviews").insert(input);
  if (error) throw new Error(error.message);
}

/* ---------------- helpers ---------------- */

export const rupee = (n: number) => "₹" + (n ?? 0).toLocaleString("en-IN");

export const statusLabel: Record<BookingStatus, string> = {
  requested: "New request",
  accepted: "Upcoming",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const categories = [
  { id: "plumber", name: "Plumber", icon: "Wrench" },
  { id: "electrician", name: "Electrician", icon: "Zap" },
  { id: "carpenter", name: "Carpenter", icon: "Hammer" },
  { id: "painter", name: "Painter", icon: "PaintRoller" },
  { id: "driver", name: "Driver", icon: "Car" },
  { id: "cleaner", name: "Cleaner", icon: "Sparkles" },
  { id: "gardener", name: "Gardener", icon: "Leaf" },
  { id: "caregiver", name: "Caregiver", icon: "HeartHandshake" },
];

export const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
