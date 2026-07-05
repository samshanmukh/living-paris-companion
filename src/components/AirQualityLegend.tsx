import { motion, AnimatePresence } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { aqiStyle, pollutantLabel } from "@/lib/waqi";
import { LAYOUT } from "@/lib/layout";

export function AirQualityLegend() {
  const visible = useSceneStore((s) => s.airQualityVisible);
  const snapshot = useSceneStore((s) => s.airQualitySnapshot);

  if (!visible || !snapshot) return null;

  const cityStyle = aqiStyle(snapshot.cityAqi);

  return (
    <AnimatePresence>
      <motion.div
        key="aqi-legend"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="pointer-events-auto absolute z-20 glass-strong"
        style={{
          left: LAYOUT.inset,
          bottom: LAYOUT.inset + 120,
          borderRadius: 16,
          padding: "10px 14px",
          maxWidth: 220,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums"
            style={{
              background: cityStyle.color,
              color: cityStyle.level === "moderate" ? "#3d3a00" : "#fff",
              boxShadow: `0 0 0 3px ${cityStyle.glow}`,
            }}
          >
            {snapshot.cityAqi}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight" style={{ color: "var(--ink)" }}>
              Paris air · {cityStyle.label}
            </p>
            <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--ink-3)" }}>
              {pollutantLabel(snapshot.dominantPol)} · {snapshot.stations.length} stations
            </p>
          </div>
        </div>
        <a
          href="https://aqicn.org/city/paris/"
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-[10px] underline-offset-2 hover:underline"
          style={{ color: "var(--ink-3)" }}
        >
          Live data via aqicn.org
        </a>
      </motion.div>
    </AnimatePresence>
  );
}
