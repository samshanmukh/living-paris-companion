import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, MapPin, Navigation, Star, X } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";

const imageCache = new Map<string, string | null>();

export function PlaceDetail() {
  const selected = useCityStore((s) => s.selected);
  const clearSelection = useCityStore((s) => s.clearSelection);
  const routeToPlace = useCityStore((s) => s.routeToPlace);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) { setImage(null); return; }
    const name = selected.properties.name;
    const type = selected.properties.type ?? selected.properties.layer;
    const key = `${name}|${type}`;
    if (imageCache.has(key)) { setImage(imageCache.get(key) ?? null); return; }
    let cancelled = false;
    fetch(`/api/place-image?name=${encodeURIComponent(name)}&type=${encodeURIComponent(String(type))}`)
      .then((r) => (r.ok ? r.json() : { image: null }))
      .then((data: { image: string | null }) => {
        imageCache.set(key, data.image);
        if (!cancelled) setImage(data.image);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") clearSelection(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, clearSelection]);

  const onStart = () => {
    if (!selected) return;
    const geo = useCityStore.getState().geojson;
    if (geo && geo.features.length >= 2) {
      void useCityStore.getState().startRoute();
    } else {
      void routeToPlace(selected);
    }
    clearSelection();
  };

  return (
    <AnimatePresence>
      {selected && (
        <>
          {/* Blurred backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={clearSelection}
            className="absolute inset-0 z-40"
            style={{
              background: "rgba(28,26,22,0.28)",
              backdropFilter: "blur(14px) saturate(120%)",
            }}
          />

          {/* Center card */}
          <motion.div
            key={selected.properties.id}
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="glass-strong pointer-events-auto absolute z-50 overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,380px)]"
            style={{
              borderRadius: 24,
              boxShadow: "0 30px 80px rgba(28,26,22,0.35)",
              border: "1px solid var(--line-strong)",
              transformOrigin: "center",
            }}
            role="dialog"
            aria-label={selected.properties.name}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero image */}
            <div
              className="relative w-full"
              style={{
                height: 180,
                background: image
                  ? undefined
                  : "linear-gradient(135deg, var(--accent-tint), var(--paper-3))",
              }}
            >
              {image && (
                <img
                  src={image}
                  alt={selected.properties.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(28,26,22,0.35), transparent 55%)" }}
              />
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Close"
                className="glass-strong absolute right-3 top-3 grid size-8 place-items-center rounded-full"
                style={{ color: "var(--ink)" }}
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-5">
              <div>
                <p className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--ink-3)" }}>
                  {selected.properties.type ?? selected.properties.layer}
                  {selected.properties.arrondissement ? ` · ${selected.properties.arrondissement}` : ""}
                </p>
                <h2
                  className="font-serif mt-1 leading-tight"
                  style={{ fontSize: 30, color: "var(--ink)", letterSpacing: "-0.015em" }}
                >
                  {selected.properties.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" style={{ color: "var(--ink-2)" }}>
                <span className="inline-flex items-center gap-1">
                  <Star size={13} strokeWidth={1.8} style={{ color: "var(--accent-text)" }} fill="currentColor" />
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>4.6</span>
                  <span style={{ color: "var(--ink-3)" }}>· 384 reviews</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} strokeWidth={1.8} />
                  Open · closes 22:00
                </span>
              </div>

              {selected.properties.address && (
                <div className="flex items-start gap-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
                  <MapPin size={13} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: "var(--accent-text)" }} />
                  <span>{selected.properties.address}</span>
                </div>
              )}

              <div
                className="rounded-2xl p-3"
                style={{ background: "var(--accent-tint)", border: "1px solid var(--accent-line)" }}
              >
                <p className="text-[11px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--accent-text)" }}>
                  Why Paris chose this
                </p>
                <p className="font-serif mt-1 leading-snug" style={{ fontSize: 16, color: "var(--ink)" }}>
                  {selected.properties.tags?.length
                    ? `Reviewers keep coming back for ${selected.properties.tags.slice(0, 2).join(", ")}. Warm, quiet, and easy to love.`
                    : "A small pleasure that pairs quietly with the rest of your day."}
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onStart}
                whileTap={{ scale: 0.97 }}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-medium"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper-2)",
                  boxShadow: "0 6px 18px rgba(28,26,22,0.24)",
                }}
              >
                <Navigation size={15} strokeWidth={2} />
                Live this one
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
