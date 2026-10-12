import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type SessionInfo = {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  city: string | null;
  roles: AppRole[];
};

export async function fetchSessionInfo(): Promise<SessionInfo | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, city").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || (user.user_metadata["full_name"] as string) || user.email || "",
    phone: profile?.phone ?? null,
    city: profile?.city ?? null,
    roles: (roles ?? []).map((r) => r.role),
  };
}


export function useSession() {
  return useQuery({ queryKey: ["session"], queryFn: fetchSessionInfo, staleTime: 30_000 });
}

export async function signOut() {
  await supabase.auth.signOut();
}
