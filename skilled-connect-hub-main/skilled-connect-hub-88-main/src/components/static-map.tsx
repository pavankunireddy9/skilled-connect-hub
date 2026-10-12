type Props = {
  lat: number;
  lng: number;
  radiusKm?: number;
  className?: string;
  alt?: string;
};

function zoomForRadius(radiusKm?: number) {
  if (!radiusKm) return 15;
  if (radiusKm <= 3) return 13;
  if (radiusKm <= 8) return 12;
  if (radiusKm <= 15) return 11;
  if (radiusKm <= 30) return 10;
  if (radiusKm <= 60) return 9;
  return 8;
}

/** Read-only map preview of a saved location. */
export function StaticMap({ lat, lng, radiusKm, className, alt = "Map preview" }: Props) {
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  if (!key) return null;

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(zoomForRadius(radiusKm)),
    size: "640x260",
    scale: "2",
    maptype: "roadmap",
    markers: `color:0x4338ca|${lat},${lng}`,
    key,
  });

  return (
    <img
      src={`https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`}
      alt={alt}
      loading="lazy"
      className={className ?? "h-40 w-full rounded-xl border border-border object-cover"}
    />
  );
}
