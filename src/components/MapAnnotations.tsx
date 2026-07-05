import { Marker as MapMarker } from "react-map-gl/mapbox";
import { AnimatePresence, motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";

// Handwritten annotations Paris "writes" onto the map beside top POIs.
const NOTES = [
  "she waits here",
  "always golden here",
  "the light bends",
  "start here",
  "a small secret",
  "linger",
];

export function MapAnnotations() {
  const geojson = useCityStore((s) => s.geojson);
  const selected = useCityStore((s) => s.selected);
  const features = (geojson?.features ?? []).slice(0, 3);
  if (features.length === 0 || selected) return null;

  return (
    <AnimatePresence>
      {features.map((f, i) => {
        const [lon, lat] = f.geometry.coordinates as [number, number];
        const note = NOTES[i % NOTES.length];
        return (
          <MapMarker key={`ann-${f.properties.id}`} longitude={lon} latitude={lat} anchor="left" offset={[18, -8]}>
            <motion.span
              initial={{ opacity: 0, y: 6, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.9 + i * 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif italic text-[12px] pointer-events-none select-none whitespace-nowrap"
              style={{
                color: "var(--accent-text)",
                textShadow: "0 1px 0 rgba(255,255,255,0.85)",
                letterSpacing: "0.01em",
              }}
            >
              — {note}
            </motion.span>
          </MapMarker>
        );
      })}
    </AnimatePresence>
  );
}
