import { Marker as MapMarker } from "react-map-gl/mapbox";
import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";

/** Concierge-written note pinned on the map (from annotate action). */
export function MapAnnotationMarker() {
  const annotation = useCityStore((s) => s.mapAnnotation);
  if (!annotation) return null;

  return (
    <MapMarker
      longitude={annotation.lon}
      latitude={annotation.lat}
      anchor="left"
      offset={[14, -6]}
    >
      <motion.span
        key={annotation.text}
        initial={{ opacity: 0, y: 8, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        className="pointer-events-none select-none whitespace-nowrap font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--accent-text)",
          textShadow: "0 1px 0 rgba(255,255,255,0.85)",
          letterSpacing: "0.01em",
        }}
      >
        — {annotation.text}
      </motion.span>
    </MapMarker>
  );
}
