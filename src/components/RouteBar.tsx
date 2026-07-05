import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight, Footprints, Map, Navigation, X } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";

/** Floating route controls — plan, navigate stops, overview. */
export function RouteBar() {
  const route = useCityStore((s) => s.route);
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const routeError = useCityStore((s) => s.routeError);
  const activeRouteStop = useCityStore((s) => s.activeRouteStop);
  const geojson = useCityStore((s) => s.geojson);
  const isRouting = useCityStore((s) => s.isRouting);
  const startRoute = useCityStore((s) => s.startRoute);
  const clearRoute = useCityStore((s) => s.clearRoute);
  const nextRouteStop = useCityStore((s) => s.nextRouteStop);
  const prevRouteStop = useCityStore((s) => s.prevRouteStop);
  const focusRouteOverview = useCityStore((s) => s.focusRouteOverview);
  const focusRouteStop = useCityStore((s) => s.focusRouteStop);

  const stopCount = geojson?.features.length ?? 0;
  const hasPlan = stopCount >= 1;
  const show = hasPlan || Boolean(route) || Boolean(routeError);

  const wps = routeWaypoints ?? [];
  const navStops = wps.length;
  const canPrev = activeRouteStop > 0;
  const canNext = activeRouteStop < navStops - 1;
  const currentWp = wps[activeRouteStop];

  const planPreview = (geojson?.features ?? [])
    .slice(0, 3)
    .map((f) => f.properties.name)
    .join(" → ");

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="pointer-events-auto fixed z-[45] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        style={{ bottom: "calc(min(52vh, 420px) + 12px + env(safe-area-inset-bottom))" }}
      >
        {route && navStops > 1 && (
          <div
            className="glass-strong flex items-center gap-1 rounded-full"
            style={{
              padding: "4px 6px",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid rgba(255,255,255,0.8)",
            }}
          >
            <button
              type="button"
              onClick={prevRouteStop}
              disabled={!canPrev}
              aria-label="Previous stop"
              className="grid size-8 place-items-center rounded-full disabled:opacity-35"
              style={{ color: "var(--ink)" }}
            >
              <ChevronLeft size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => focusRouteStop(activeRouteStop)}
              className="min-w-[140px] max-w-[220px] truncate px-2 text-center"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}
            >
              {activeRouteStop === 0 ? "Start" : currentWp?.name ?? `Stop ${activeRouteStop}`}
              <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>
                {" "}· {activeRouteStop + 1}/{navStops}
              </span>
            </button>

            <button
              type="button"
              onClick={nextRouteStop}
              disabled={!canNext}
              aria-label="Next stop"
              className="grid size-8 place-items-center rounded-full disabled:opacity-35"
              style={{ color: "var(--ink)" }}
            >
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>

            <span className="mx-0.5 h-5 w-px" style={{ background: "rgba(28,26,22,0.12)" }} />

            <button
              type="button"
              onClick={focusRouteOverview}
              aria-label="Show full route"
              className="grid size-8 place-items-center rounded-full"
              style={{ color: "var(--accent-text)" }}
            >
              <Map size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        <div
          className="glass-strong flex items-center gap-3 rounded-full"
          style={{
            padding: "8px 10px 8px 14px",
            boxShadow: "var(--shadow-panel)",
            border: routeError
              ? "1px solid rgba(200,80,60,0.45)"
              : route
                ? "1px solid var(--accent-line)"
                : "1px solid rgba(255,255,255,0.75)",
            minWidth: 280,
            maxWidth: "min(92vw, 420px)",
          }}
        >
          {routeError ? (
            <AlertCircle size={16} strokeWidth={2} style={{ color: "#C8503C", flexShrink: 0 }} />
          ) : (
            <Footprints size={16} strokeWidth={2} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
          )}

          {routeError ? (
            <>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
                  {routeError}
                </p>
              </div>
              <motion.button
                type="button"
                onClick={() => void startRoute()}
                disabled={isRouting}
                whileTap={{ scale: 0.96 }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper-2)",
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: isRouting ? 0.7 : 1,
                }}
              >
                Retry
              </motion.button>
            </>
          ) : route ? (
            <>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>
                  {Math.round(route.durationMinutes)} min walk · {(route.distanceMeters / 1000).toFixed(1)} km
                </p>
                <p className="truncate" style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>
                  {wps.slice(1).map((w) => w.name).filter(Boolean).join(" → ") || `${stopCount} stops`}
                </p>
              </div>
              <button
                type="button"
                onClick={clearRoute}
                aria-label="Clear route"
                className="grid size-8 shrink-0 place-items-center rounded-full"
                style={{ background: "rgba(255,255,255,0.7)", color: "var(--ink-2)" }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  {stopCount === 1 ? "1 stop ready" : `${stopCount} stops ready`}
                </p>
                <p className="truncate" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {planPreview || "Tap to draw your walking route"}
                </p>
              </div>
              <motion.button
                type="button"
                onClick={() => void startRoute()}
                disabled={isRouting}
                whileTap={{ scale: 0.96 }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2"
                style={{
                  background: "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))",
                  color: "var(--paper-2)",
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: isRouting ? 0.7 : 1,
                }}
              >
                <Navigation size={14} strokeWidth={2.2} />
                {isRouting ? "Routing…" : "Start route"}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
