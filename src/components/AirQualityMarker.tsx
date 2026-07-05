import { motion } from "framer-motion";
import { aqiStyle } from "@/lib/waqi";
import type { AqiStation } from "@/lib/types";

export function AirQualityMarker({
  station,
  index,
  reducedMotion,
}: {
  station: AqiStation;
  index: number;
  reducedMotion: boolean;
}) {
  const style = aqiStyle(station.aqi);
  const display = station.aqi <= 0 ? "—" : String(station.aqi);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: 44, height: 44 }}
      title={`${station.name}: AQI ${display} (${style.label})`}
    >
      {!reducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: style.glow, border: `2px solid ${style.color}` }}
          animate={{ scale: [0.85, 1.35, 0.85], opacity: [0.55, 0.12, 0.55] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: (index % 7) * 0.18, ease: "easeInOut" }}
        />
      )}
      <motion.div
        initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reducedMotion ? 0 : (index % 12) * 0.04, type: "spring", stiffness: 280, damping: 20 }}
        className="relative z-10 grid place-items-center rounded-full font-semibold tabular-nums shadow-md"
        style={{
          width: 30,
          height: 30,
          fontSize: 11,
          color: style.level === "moderate" ? "#3d3a00" : "#fff",
          background: style.color,
          boxShadow: `0 4px 14px ${style.glow}`,
          border: "2px solid rgba(255,255,255,0.85)",
        }}
      >
        {display}
      </motion.div>
    </div>
  );
}
