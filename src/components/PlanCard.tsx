import { motion, AnimatePresence } from "framer-motion";
import { Clock, Footprints, Sparkles } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import { chatPanelBottomOffset, resolveChatPanelSize } from "@/lib/chatPanel";
import { planTitle } from "@/lib/placeSearch";
import { buildItineraries } from "@/lib/itinerary";

function categoryLabel(layer: string) {
  if (/museum/i.test(layer)) return "Museum";
  if (/caf|coffee|food/i.test(layer)) return "Café & bites";
  if (/park/i.test(layer)) return "Park & walk";
  return "Place";
}

export function PlanCard() {
  const geojson = useCityStore((s) => s.geojson);
  const mood = useCityStore((s) => s.mood);
  const rainMode = useCityStore((s) => s.rainMode);
  const center = useCityStore((s) => s.center);
  const route = useCityStore((s) => s.route);
  const isThinking = useCityStore((s) => s.isThinking);
  const isRouting = useCityStore((s) => s.isRouting);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);
  const select = useCityStore((s) => s.select);
  const selected = useCityStore((s) => s.selected);
  const startRoute = useCityStore((s) => s.startRoute);
  const assistantExpanded = useUIStore((s) => s.assistantExpanded);
  const assistantFullscreen = useUIStore((s) => s.assistantFullscreen);

  const features = geojson?.features ?? [];
  const panelSize = resolveChatPanelSize(assistantFullscreen, assistantExpanded, routePreviewPlaying);
  const show = features.length >= 1 && !route && !routePreviewPlaying && !isThinking;

  const plan = show ? buildItineraries(features, center)[0] : null;
  const stops = plan?.stops ?? features.slice(0, 4);

  if (!show || !stops.length) return null;

  return (
    <AnimatePresence>
      <motion.section
        key="plan-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        className="pointer-events-auto fixed z-[44] inset-x-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[min(440px,calc(100vw-24px))]"
        style={{ bottom: chatPanelBottomOffset(panelSize) }}
        aria-label="Your Paris plan"
      >
        <div
          className="glass-strong overflow-hidden"
          style={{
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.82)",
            boxShadow: "var(--shadow-panel)",
          }}
        >
          <div
            className="flex items-start justify-between gap-3 px-4 pt-4 pb-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.55)" }}
          >
            <div className="min-w-0">
              <p
                className="text-[11px] uppercase font-semibold"
                style={{ letterSpacing: "0.12em", color: "var(--ink-3)" }}
              >
                Your plan · {stops.length} {stops.length === 1 ? "place" : "places"}
              </p>
              <h2 className="font-serif mt-0.5 text-xl leading-tight" style={{ color: "var(--ink)" }}>
                {planTitle(mood, rainMode)}
              </h2>
              {plan && (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>
                  <span className="inline-flex items-center gap-1">
                    <Footprints size={11} strokeWidth={2} />
                    {plan.km} km
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} strokeWidth={2} />
                    ~{plan.minutes} min
                  </span>
                </p>
              )}
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              disabled={isRouting || stops.length < 1}
              onClick={() => void startRoute()}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5"
              style={{
                background: "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))",
                color: "var(--paper-2)",
                fontSize: 13,
                fontWeight: 600,
                opacity: isRouting ? 0.7 : 1,
              }}
            >
              <Sparkles size={14} strokeWidth={2.2} />
              {isRouting ? "Opening…" : "Live this one"}
            </motion.button>
          </div>

          <ol className="max-h-[min(34vh,240px)] overflow-y-auto px-3 py-2 lp-scroll">
            {stops.map((place, i) => {
              const active = selected?.properties.id === place.properties.id;
              return (
                <li key={place.properties.id ?? i}>
                  <button
                    type="button"
                    onClick={() => select(place)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors"
                    style={{
                      background: active ? "var(--accent-tint)" : "transparent",
                      border: active ? "1px solid var(--accent-line)" : "1px solid transparent",
                    }}
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-full font-serif text-sm"
                      style={{
                        background: active ? "var(--accent)" : "rgba(255,255,255,0.75)",
                        color: active ? "var(--paper-2)" : "var(--ink)",
                        border: "1px solid rgba(255,255,255,0.8)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate font-medium"
                        style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.3 }}
                      >
                        {place.properties.name}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: "var(--ink-3)", marginTop: 2 }}>
                        {categoryLabel(place.properties.layer)}
                        {place.properties.arrondissement ? ` · ${place.properties.arrondissement}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
