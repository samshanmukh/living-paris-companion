import { motion } from "framer-motion";
import { useSceneStore, type Season } from "@/store/useSceneStore";
import { useCityStore } from "@/store/useCityStore";
import { SEASON_LABELS } from "@/lib/seasonEffects";

const SEASONS: { key: Season; label: string; emoji: string; hint: string }[] = [
  { key: "spring", label: "Spring", emoji: "🌸", hint: "Pink-green blossom haze on the map" },
  { key: "summer", label: "Summer", emoji: "☀︎", hint: "Warm golden summer light" },
  { key: "autumn", label: "Autumn", emoji: "🍂", hint: "Amber autumn glow on rooftops" },
  { key: "winter", label: "Winter", emoji: "❄︎", hint: "Snowfall over Paris" },
];

function flashSeasonHint(label: string) {
  useCityStore.setState({ lastChanged: [label] });
  window.setTimeout(() => useCityStore.setState({ lastChanged: [] }), 3200);
}

export function SeasonToggle() {
  const season = useSceneStore((s) => s.seasonOverride);
  const setSeason = useSceneStore((s) => s.setSeason);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="glass pointer-events-auto absolute z-20 flex flex-row gap-1"
      style={{ top: 24, right: 296, padding: 5, borderRadius: 999, boxShadow: "var(--shadow-soft)" }}
      role="group"
      aria-label="Season atmosphere"
    >
      {SEASONS.map((s) => {
        const active = season === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              const next = active ? null : s.key;
              setSeason(next);
              flashSeasonHint(next ? SEASON_LABELS[next] : "Live Paris season");
            }}
            title={active ? `${s.hint} — tap to reset` : s.hint}
            aria-label={s.label}
            aria-pressed={active}
            className="grid place-items-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
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
