import { AnimatePresence, motion } from "framer-motion";
import { MOOD_THEMES } from "@/lib/moods";
import { useCityStore } from "@/store/useCityStore";
import { ambientIn } from "@/lib/motion";

export function AmbientCard() {
  const mood = useCityStore((s) => s.mood);
  const line = (MOOD_THEMES[mood]?.line ?? MOOD_THEMES.general.line);

  return (
    <div
      className="lp-ambient pointer-events-auto absolute z-10"
      style={{ right: 24, top: 80, width: 260 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={mood}
          {...ambientIn}
          className="relative overflow-hidden"
          style={{
            background: "var(--paper-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-card)",
            boxShadow: "var(--shadow-card)",
            padding: 18,
          }}
        >
          <p
            className="font-display text-[10px] uppercase"
            style={{ letterSpacing: "0.14em", color: "var(--accent-text)", fontWeight: 700 }}
          >
            Paris says
          </p>
          <p
            className="font-display mt-2"
            style={{ fontSize: 18, lineHeight: 1.25, color: "var(--ink)", fontWeight: 700 }}
          >
            {line}
          </p>
          <div
            className="mt-4"
            style={{ height: 2, width: 40, background: "var(--accent)", borderRadius: 2 }}
          />
          <p
            className="mt-2 text-[11px]"
            style={{ color: "var(--ink-3)", letterSpacing: "0.02em" }}
          >
            — from the {mood === "general" ? "arrondissements" : mood} desk
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
