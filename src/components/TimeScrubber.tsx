import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";

const PRESETS: { hour: number; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { hour: 6,  label: "Dawn",   icon: Sunrise },
  { hour: 13, label: "Day",    icon: Sun },
  { hour: 19, label: "Dusk",   icon: Sunset },
  { hour: 23, label: "Night",  icon: Moon },
];

export function TimeScrubber() {
  const hour = useSceneStore((s) => s.hourOverride);
  const setHour = useSceneStore((s) => s.setHour);
  const value = hour ?? new Date().getHours();

  // Sun/moon arc position
  const arc = useMemo(() => {
    const t = value / 24; // 0..1
    const x = 50 * (1 - Math.cos(Math.PI * t * 2)) / 2 + t * 100; // sway
    const y = 20 - Math.sin(Math.PI * (value >= 6 && value <= 20 ? (value - 6) / 14 : 0)) * 14;
    return { x: `${Math.min(96, Math.max(4, (value / 24) * 100))}%`, y };
  }, [value]);

  const isNight = value < 6 || value >= 20;

  useEffect(() => () => setHour(null), [setHour]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 20 }}
      className="glass pointer-events-auto absolute z-20 hidden md:flex flex-col"
      style={{
        bottom: 24, left: "50%", transform: "translateX(-50%)",
        width: 420, padding: "10px 14px 12px",
        borderRadius: 20, boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Arc */}
      <div className="relative h-8 mb-1">
        <svg viewBox="0 0 100 30" className="absolute inset-0 w-full h-full">
          <path d="M2,28 Q50,-6 98,28" fill="none" stroke="var(--line-strong)" strokeWidth="0.4" strokeDasharray="1 1.5"/>
        </svg>
        <motion.div
          animate={{ left: arc.x, top: arc.y }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="absolute grid place-items-center"
          style={{ width: 18, height: 18, transform: "translate(-50%, 0)" }}
        >
          {isNight ? <Moon size={14} strokeWidth={1.6} color="var(--ink-2)" /> : <Sun size={14} strokeWidth={1.6} color="var(--accent)" />}
        </motion.div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-2)", minWidth: 34 }}>
          {String(value).padStart(2, "0")}:00
        </span>
        <input
          type="range"
          min={0}
          max={23}
          value={value}
          onChange={(e) => setHour(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
          style={{ accentColor: "var(--accent)" }}
          aria-label="Hour"
        />
        <button
          type="button"
          onClick={() => setHour(null)}
          className="text-[10px] uppercase"
          style={{
            color: hour === null ? "var(--ink-3)" : "var(--accent-text)",
            letterSpacing: "0.12em", fontWeight: 500,
          }}
        >
          {hour === null ? "live" : "reset"}
        </button>
      </div>

      <div className="flex gap-1 mt-2 justify-between">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = value === p.hour;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setHour(p.hour)}
              className="flex-1 inline-flex items-center justify-center gap-1"
              style={{
                padding: "5px 8px",
                borderRadius: 999,
                background: active ? "var(--accent-tint)" : "transparent",
                color: active ? "var(--accent-text)" : "var(--ink-2)",
                border: `1px solid ${active ? "var(--accent-line)" : "transparent"}`,
                fontSize: 11, fontWeight: 500,
              }}
            >
              <Icon size={12} strokeWidth={1.6} />
              {p.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
