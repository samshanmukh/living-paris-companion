import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { buildItineraries } from "@/lib/itinerary";
import { Clock, Footprints } from "lucide-react";

export function ItineraryCards() {
  const geojson = useCityStore((s) => s.geojson);
  const center = useCityStore((s) => s.center);
  const planItinerary = useCityStore((s) => s.planItinerary);
  const [idx, setIdx] = useState(0);

  const features = geojson?.features ?? [];
  const itineraries = features.length >= 2 ? buildItineraries(features, center) : [];
  if (itineraries.length === 0) return null;

  const current = itineraries[Math.min(idx, itineraries.length - 1)];

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && idx < itineraries.length - 1) setIdx(idx + 1);
    else if (info.offset.x > 60 && idx > 0) setIdx(idx - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 140, damping: 20 }}
      className="pointer-events-auto absolute z-20 hidden md:block"
      style={{ bottom: 260, right: 24, width: 320 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, x: 40, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -40, rotate: -2 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          whileTap={{ scale: 0.98, cursor: "grabbing" }}
          onClick={() => void planItinerary(current.stops)}
          className="glass cursor-grab"
          style={{
            padding: 14,
            borderRadius: 18,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-[19px] leading-tight" style={{ color: "var(--ink)" }}>
              {current.title}
            </span>
            <div className="flex gap-1">
              {itineraries.map((_, i) => (
                <span
                  key={i}
                  className="inline-block rounded-full"
                  style={{
                    width: 5, height: 5,
                    background: i === idx ? "var(--accent)" : "var(--line-strong)",
                  }}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-[12px] italic" style={{ color: "var(--ink-2)" }}>
            {current.vibe}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: "var(--ink-2)" }}>
            <span className="inline-flex items-center gap-1"><Footprints size={11} strokeWidth={1.6} /> {current.km} km</span>
            <span className="inline-flex items-center gap-1"><Clock size={11} strokeWidth={1.6} /> {current.minutes} min</span>
            <span>· {current.stops.length} stops</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {current.stops.map((s) => (
              <span
                key={s.properties.id}
                className="text-[10px]"
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--paper-3)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line)",
                }}
              >
                {s.properties.name}
              </span>
            ))}
          </div>
          <div className="mt-2 text-[10px] uppercase text-center" style={{ color: "var(--ink-3)", letterSpacing: "0.14em" }}>
            swipe · tap to draw route
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
