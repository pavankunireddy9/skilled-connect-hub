import { ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasCoords } from "@/lib/geo";

export function JobDirections({ lat, lng, address, originLat, originLng }: { lat: number | null; lng: number | null; address: string; originLat?: number | null | undefined; originLng?: number | null | undefined }) {
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const valid = hasCoords({ lat, lng });
  if (!valid) return null;
  const destination = `${lat},${lng}`;
  const origin = hasCoords({ lat: originLat ?? null, lng: originLng ?? null }) ? `${originLat},${originLng}` : undefined;
  const directions = new URL("https://www.google.com/maps/dir/");
  directions.searchParams.set("api", "1");
  directions.searchParams.set("destination", destination);
  directions.searchParams.set("travelmode", "driving");
  if (origin) directions.searchParams.set("origin", origin);
  const embed = key && valid ? new URL(origin ? "https://www.google.com/maps/embed/v1/directions" : "https://www.google.com/maps/embed/v1/place") : null;
  if (embed) {
    embed.searchParams.set("key", key);
    if (origin) {
      embed.searchParams.set("origin", origin);
      embed.searchParams.set("destination", destination);
      embed.searchParams.set("mode", "driving");
    } else embed.searchParams.set("q", destination);
  }
  return <div className="mt-4 space-y-3 border-t border-border pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="flex items-center gap-2 text-sm font-medium"><Navigation className="size-4 text-primary" /> Customer location</p>
      <Button asChild size="sm" variant="outline"><a href={directions.toString()} target="_blank" rel="noopener noreferrer">Get directions <ExternalLink className="size-4" /></a></Button>
    </div>
    <p className="text-sm text-muted-foreground">{address}</p>
    {embed ? <iframe title="Driving route to customer" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={embed.toString()} className="h-64 w-full rounded-md border border-border" /> : null}
  </div>;
}
