import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addressFromCoords,
  resolvePlace,
  suggestPlaces,
  type PlaceLocation,
  type PlaceSuggestion,
} from "@/lib/places.functions";

export type { PlaceLocation };

type Props = {
  value: PlaceLocation | null;
  onChange: (value: PlaceLocation | null) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
};

function newToken() {
  return (globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random()).slice(0, 36);
}

export function LocationPicker({
  value,
  onChange,
  label = "Location",
  placeholder = "Start typing an address, area or landmark",
  hint = "Pick a suggestion or use your current location — no need to type the full address.",
}: Props) {
  const suggest = useServerFn(suggestPlaces);
  const resolve = useServerFn(resolvePlace);
  const reverse = useServerFn(addressFromCoords);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useMemo(newToken, []);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setItems([]);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        setBusy(true);
        const result = await suggest({ data: { input: q, sessionToken: token } });
        if (id === requestId.current) {
          setItems(result);
          setOpen(true);
          setError(null);
        }
      } catch (e) {
        if (id === requestId.current) setError((e as Error).message);
      } finally {
        if (id === requestId.current) setBusy(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, suggest, token]);

  const pick = async (s: PlaceSuggestion) => {
    setOpen(false);
    setBusy(true);
    setError(null);
    try {
      const place = await resolve({ data: { placeId: s.placeId, sessionToken: token } });
      onChange(place);
      setQuery("");
      setItems([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("This device cannot share its location.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const place = await reverse({
            data: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
          onChange(place);
          setQuery("");
          setItems([]);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("Location permission was denied. Search for the address instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>

      {value ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-primary/40 bg-brand-soft px-3.5 py-3"
        >
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary">{value.address}</p>
            <p className="text-xs text-muted-foreground">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
          <button
            onClick={() => onChange(null)}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Change
          </button>
        </motion.div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => items.length > 0 && setOpen(true)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm outline-none"
            />
            {busy ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
          </div>

          <AnimatePresence>
            {open && items.length > 0 ? (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
              >
                {items.map((s) => (
                  <li key={s.placeId}>
                    <button
                      onClick={() => pick(s)}
                      className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      {s.label}
                    </button>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={useMyLocation}
          disabled={locating}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-60",
          )}
        >
          {locating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Crosshair className="size-3.5" />
          )}
          {locating ? "Finding you…" : "Use my current location"}
        </button>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
