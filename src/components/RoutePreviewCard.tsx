import { motion, AnimatePresence } from "framer-motion";
import { Footprints, SkipForward } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { isPlaceOnlyRoute } from "@/lib/routePreview";

export function RoutePreviewCard() {
  const playing = useCityStore((s) => s.routePreviewPlaying);
  const stopIndex = useCityStore((s) => s.routePreviewStop);
  const waypoints = useCityStore((s) => s.routeWaypoints);
  const skipRoutePreview = useCityStore((s) => s.skipRoutePreview);

  const wps = waypoints ?? [];
  const total = wps.length;
  const current = wps[stopIndex];
  const placeOnly = isPlaceOnlyRoute(wps);
  const label = current?.name ?? `Stop ${stopIndex + 1}`;

  return (
    <AnimatePresence>
      {playing && total > 0 && (
        <motion.div
          key="route-preview-card"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="pointer-events-auto fixed z-[46] left-1/2 -translate-x-1/2"
          style={{ top: "calc(72px + env(safe-area-inset-top))" }}
        >
          <div
            className="glass-strong overflow-hidden"
            style={{
              borderRadius: 20,
              minWidth: 280,
              maxWidth: "min(92vw, 380px)",
              boxShadow: "var(--shadow-panel)",
              border: "1px solid rgba(255,255,255,0.82)",
            }}
          >
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, var(--accent) ${((stopIndex + 1) / total) * 100}%, rgba(28,26,22,0.08) 0%)`,
                transition: "background 0.5s var(--ease-out)",
              }}
            />
            <div className="flex items-start gap-3 p-4">
              <div
                className="grid size-11 shrink-0 place-items-center rounded-2xl font-serif text-lg"
                style={{
                  background: "var(--accent-tint)",
                  color: "var(--accent-text)",
                  border: "1px solid var(--accent-line)",
                }}
              >
                {placeOnly ? stopIndex + 1 : stopIndex === 0 ? "A" : stopIndex}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-xl leading-tight truncate" style={{ color: "var(--ink)" }}>
                  {label}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--ink-3)" }}>
                  <Footprints size={13} strokeWidth={2} style={{ color: "var(--accent-text)" }} />
                  Place {stopIndex + 1} of {total}
                </p>
              </div>
              <button
                type="button"
                onClick={skipRoutePreview}
                className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line)",
                }}
              >
                <SkipForward size={13} strokeWidth={2.2} />
                Skip
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
