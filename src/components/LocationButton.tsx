import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Search, X, Check } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { topBarLeft, topBarRight, topSafe } from "@/lib/layout";

async function geocodeAddress(q: string): Promise<{ coords: [number, number]; label: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", Paris, France")}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const data = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    const label = data[0].display_name.split(",").slice(0, 2).join(", ");
    return { coords: [parseFloat(data[0].lon), parseFloat(data[0].lat)], label };
  } catch {
    return null;
  }
}

export function LocationButton() {
  const userLocation = useCityStore((s) => s.userLocation);
  const setUserLocation = useCityStore((s) => s.setUserLocation);
  const [address, setAddress] = useState("");
  const [locked, setLocked] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userLocation) {
      setLocked(null);
      // focus input when unlocked
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [userLocation]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const q = address.trim();
    if (!q) return;
    setError(false);
    setGeocoding(true);
    const res = await geocodeAddress(q);
    setGeocoding(false);
    if (res) {
      setUserLocation(res.coords);
      setLocked(res.label);
      setAddress("");
    } else {
      setError(true);
    }
  };

  const unlock = () => {
    setUserLocation(null);
    setLocked(null);
  };

  return (
    <div
      className="pointer-events-auto fixed z-40"
      style={{
        top: topSafe(),
        left: topBarLeft(),
        right: topBarRight(),
        width: "auto",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {locked ? (
          <motion.button
            key="locked"
            type="button"
            onClick={unlock}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center gap-2 rounded-full"
            style={{
              padding: "9px 12px 9px 12px",
              background: "var(--accent)",
              border: "1px solid var(--accent)",
              backdropFilter: "blur(20px) saturate(160%)",
              boxShadow: "0 10px 26px color-mix(in oklab, var(--accent) 40%, transparent)",
              color: "var(--paper-2)",
            }}
            aria-label={`Locked: ${locked}. Click to change.`}
          >
            <span
              className="grid size-6 place-items-center rounded-full shrink-0"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              <Check size={13} strokeWidth={2.4} />
            </span>
            <span className="truncate" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em", flex: 1, textAlign: "left" }}>
              {locked}
            </span>
            <X size={13} strokeWidth={2} style={{ opacity: 0.85 }} />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            onSubmit={submit}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="flex items-center rounded-full"
            style={{
              padding: "5px 5px 5px 13px",
              background: "rgba(255,255,255,0.75)",
              border: error ? "1px solid #d9645a" : "1px solid rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px) saturate(160%)",
              boxShadow: "0 12px 28px rgba(28,26,22,0.18)",
            }}
          >
            <MapPin size={14} strokeWidth={2} style={{ color: "var(--ink-2)", marginRight: 8 }} />
            <input
              ref={inputRef}
              value={address}
              onChange={(e) => { setAddress(e.target.value); if (error) setError(false); }}
              placeholder={error ? "Not found — try again" : "Type your location in Paris…"}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", minWidth: 0 }}
            />
            <button
              type="submit"
              disabled={!address.trim() || geocoding}
              aria-label="Find location"
              className="grid size-7 shrink-0 place-items-center rounded-full"
              style={{
                background: address.trim()
                  ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))"
                  : "rgba(255,255,255,0.5)",
                color: "var(--paper-2)",
                opacity: address.trim() ? 1 : 0.5,
              }}
            >
              {geocoding ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} strokeWidth={2.2} />}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
