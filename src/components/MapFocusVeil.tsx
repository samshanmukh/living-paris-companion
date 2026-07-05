import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";

/** Dim map edges so marker bubbles stay readable over the basemap. */
export function MapFocusVeil() {
  const geojson = useCityStore((s) => s.geojson);
  const selected = useCityStore((s) => s.selected);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);

  const count = geojson?.features.length ?? 0;
  const active = count > 0 || Boolean(selected) || routePreviewPlaying;
  if (!active) return null;

  const base = selected || routePreviewPlaying ? 0.55 : count >= 3 ? 0.46 : 0.38;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2]"
      initial={{ opacity: 0 }}
      animate={{ opacity: base }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: `
          radial-gradient(ellipse 70% 56% at 50% 40%, transparent 0%, transparent 36%, var(--map-veil, rgba(40,36,28,0.5)) 100%),
          linear-gradient(to bottom, rgba(244,240,232,0.06) 0%, transparent 20%, transparent 70%, rgba(28,26,22,0.2) 100%)
        `,
        mixBlendMode: "multiply",
      }}
    />
  );
}
