import { motion } from "framer-motion";
import { useSceneStore, type Season } from "@/store/useSceneStore";

const SEASONS: { key: Season; label: string; emoji: string }[] = [
  { key: "spring", label: "Spring", emoji: "🌸" },
  { key: "summer", label: "Summer", emoji: "☀︎" },
  { key: "autumn", label: "Autumn", emoji: "🍂" },
  { key: "winter", label: "Winter", emoji: "❄︎" },
];

export function SeasonToggle() {
  const season = useSceneStore((s) => s.seasonOverride);
  const setSeason = useSceneStore((s) => s.setSeason);
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="glass pointer-events-auto absolute z-20 hidden md:flex flex-row gap-1"
      style={{ top: 24, right: 296, padding: 5, borderRadius: 999, boxShadow: "var(--shadow-soft)" }}
    >
      {SEASONS.map((s) => {
        const active = season === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setSeason(active ? null : s.key)}
            title={s.label}
            aria-label={s.label}
            aria-pressed={active}
            className="grid place-items-center"
            style={{
              width: 30, height: 30, borderRadius: 10,
              background: active ? "var(--accent-tint)" : "transparent",
              border: `1px solid ${active ? "var(--accent-line)" : "transparent"}`,
              fontSize: 13,
              color: active ? "var(--accent-text)" : "var(--ink-2)",
            }}
          >
            {s.emoji}
          </button>
        );
      })}
    </motion.div>
  );
}
