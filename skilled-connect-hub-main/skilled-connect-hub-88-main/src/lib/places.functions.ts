import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders(extra: Record<string, string> = {}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps is not connected for this project.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function readOrThrow(response: Response) {
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403) {
      throw new Error("Google Maps denied this request (403). Check the map key restrictions.");
    }
    throw new Error(`Google Maps request failed [${response.status}]: ${body}`);
  }
  return response.json();
}

export type PlaceSuggestion = { placeId: string; label: string };
export type PlaceLocation = {
  placeId: string;
  address: string;
  lat: number;
  lng: number;
};

/** Address autocomplete suggestions for a typed query. */
export const suggestPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        input: z.string().trim().min(2).max(200),
        sessionToken: z.string().min(8).max(64),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => {
    const body: Record<string, unknown> = {
      input: data.input,
      sessionToken: data.sessionToken,
      includedRegionCodes: ["in"],
    };
    if (data.lat !== undefined && data.lng !== undefined) {
      body["locationBias"] = {
        circle: { center: { latitude: data.lat, longitude: data.lng }, radius: 50000 },
      };
    }

    const json = await readOrThrow(
      await fetch(`${GATEWAY_URL}/places/v1/places:autocomplete`, {
        method: "POST",
        headers: gatewayHeaders({
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
        }),
        body: JSON.stringify(body),
      }),
    );

    const suggestions = (json?.suggestions ?? []) as Array<{
      placePrediction?: { placeId?: string; text?: { text?: string } };
    }>;
    return suggestions
      .map((s) => ({
        placeId: s.placePrediction?.placeId ?? "",
        label: s.placePrediction?.text?.text ?? "",
      }))
      .filter((s) => s.placeId && s.label)
      .slice(0, 6);
  });

/** Full address + coordinates for a selected suggestion. */
export const resolvePlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        placeId: z.string().trim().min(3).max(300),
        sessionToken: z.string().min(8).max(64).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<PlaceLocation> => {
    const query = data.sessionToken ? `?sessionToken=${encodeURIComponent(data.sessionToken)}` : "";
    const json = await readOrThrow(
      await fetch(
        `${GATEWAY_URL}/places/v1/places/${encodeURIComponent(data.placeId)}${query}`,
        {
          headers: gatewayHeaders({ "X-Goog-FieldMask": "id,formattedAddress,location" }),
        },
      ),
    );

    return {
      placeId: (json?.id as string) ?? data.placeId,
      address: (json?.formattedAddress as string) ?? "",
      lat: Number(json?.location?.latitude ?? 0),
      lng: Number(json?.location?.longitude ?? 0),
    };
  });

/** Turn device coordinates into a readable address. */
export const addressFromCoords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<PlaceLocation> => {
    const json = await readOrThrow(
      await fetch(
        `${GATEWAY_URL}/maps/api/geocode/json?latlng=${data.lat},${data.lng}&region=in`,
        { headers: gatewayHeaders() },
      ),
    );

    const first = (json?.results ?? [])[0] as
      | { formatted_address?: string; place_id?: string }
      | undefined;
    return {
      placeId: first?.place_id ?? "",
      address: first?.formatted_address ?? `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
      lat: data.lat,
      lng: data.lng,
    };
  });
