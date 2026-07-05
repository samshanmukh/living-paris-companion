import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, X, MapPin } from "lucide-react";
import { useUIStore, type Destination } from "@/store/useUIStore";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
};

async function searchParis(q: string): Promise<Suggestion[]> {
  // Bias to Paris via viewbox + countrycodes=fr
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json&addressdetails=0&limit=6&countrycodes=fr` +
    `&viewbox=2.224,48.902,2.469,48.815&bounded=1` +
    `&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return [];
    return (await r.json()) as Suggestion[];
  } catch {
    return [];
  }
}

export function DestinationSearchBar() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const activePersona = useUIStore((s) => s.activePersona);
  const setDestination = useUIStore((s) => s.setDestination);
  const destination = useUIStore((s) => s.destination);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const term = q.trim();
    if (term.length < 3) {
      setItems([]);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const res = await searchParis(term);
      setItems(res);
      setLoading(false);
    }, 260);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const pick = (s: Suggestion) => {
    const label = s.display_name.split(",").slice(0, 2).join(", ");
    const d: Destination = {
      name: label,
      address: s.display_name,
      lat: parseFloat(s.lat),
      lon: parseFloat(s.lon),
    };
    setDestination(d);
    setQ(label);
    setItems([]);
    setFocused(false);
  };

  const clear = () => {
    setDestination(null);
    setQ("");
    setItems([]);
  };

  const open = focused && (items.length > 0 || loading);
  const hint =
    activePersona
      ? `Persona: ${activePersona}. Pick a destination →`
      : "Tip: pick a persona first, then search";

  return (
    <div
      className="pointer-events-auto fixed z-40 left-1/2 -translate-x-1/2"
      style={{
        top: "calc(70px + env(safe-area-inset-top))",
        width: "min(440px, calc(100vw - 24px))",
      }}
    >
      <div
        className="flex items-center rounded-full"
        style={{
          padding: "6px 6px 6px 12px",
          background: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px) saturate(160%)",
          boxShadow: "0 12px 28px rgba(28,26,22,0.18)",
        }}
      >
        <Search size={14} strokeWidth={2} style={{ color: "var(--ink-2)", marginRight: 8 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          placeholder="Where do you want to go?"
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", minWidth: 0 }}
        />
        {loading && <Loader2 size={13} className="animate-spin" style={{ color: "var(--ink-2)" }} />}
        {(destination || q) && !loading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear destination"
            className="grid size-7 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.6)", color: "var(--ink-2)" }}
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      <p
        className="mt-1.5 text-center"
        style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 500 }}
      >
        {hint}
      </p>

      <AnimatePresence>
        {open && (
          <motion.ul
            key="sugg"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="mt-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px) saturate(160%)",
              boxShadow: "0 14px 34px rgba(28,26,22,0.2)",
            }}
          >
            {loading && items.length === 0 && (
              <li style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--ink-3)" }}>
                Searching Paris…
              </li>
            )}
            {items.map((s) => {
              const [head, ...rest] = s.display_name.split(",");
              return (
                <li key={`${s.lat}-${s.lon}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                    className="w-full flex items-start gap-2.5 text-left"
                    style={{
                      padding: "10px 14px",
                      borderTop: "1px solid rgba(255,255,255,0.6)",
                    }}
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full mt-0.5"
                      style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}
                    >
                      <MapPin size={11} strokeWidth={2.2} />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span
                        className="truncate"
                        style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
                      >
                        {head}
                      </span>
                      <span
                        className="truncate"
                        style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}
                      >
                        {rest.join(",").trim()}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
