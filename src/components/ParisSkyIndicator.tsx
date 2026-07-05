import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import {
  formatParisTime,
  resolveLightPreset,
  skyKindFromPreset,
  type SkyKind,
} from "@/lib/parisWeather";
import { useSceneStore } from "@/store/useSceneStore";

const SKY_COLOR: Record<SkyKind, string> = {
  sun: "#C79A4E",
  moon: "#8B9BB8",
  sunrise: "#E08B5A",
  sunset: "#C77E6A",
};

function SkyIcon({ kind }: { kind: SkyKind }) {
  const color = SKY_COLOR[kind];
  const props = { size: 15, strokeWidth: 2, color, "aria-hidden": true as const };
  if (kind === "moon") return <Moon {...props} fill={color} fillOpacity={0.35} />;
  if (kind === "sunrise") return <Sunrise {...props} />;
  if (kind === "sunset") return <Sunset {...props} />;
  return <Sun {...props} />;
}

export function ParisSkyIndicator() {
  const parisConditions = useSceneStore((s) => s.parisConditions);
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const [timeLabel, setTimeLabel] = useState(() => formatParisTime());

  useEffect(() => {
    const tick = () => {
      if (hourOverride != null) {
        setTimeLabel(`${String(hourOverride).padStart(2, "0")}:00`);
      } else {
        setTimeLabel(formatParisTime());
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [hourOverride]);

  const preset = useMemo(
    () => resolveLightPreset(parisConditions, hourOverride),
    [parisConditions, hourOverride],
  );
  const skyKind = skyKindFromPreset(preset);

  return (
    <div
      className="flex items-center gap-1.5 border-l pl-2.5"
      style={{ borderColor: "rgba(28,26,22,0.1)" }}
      aria-label={`Paris local time ${timeLabel}, ${preset}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={skyKind}
          initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="grid place-items-center"
        >
          <SkyIcon kind={skyKind} />
        </motion.span>
      </AnimatePresence>
      <span
        className="tabular-nums"
        style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}
      >
        {timeLabel}
      </span>
    </div>
  );
}
