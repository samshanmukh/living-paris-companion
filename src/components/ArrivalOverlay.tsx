import { AnimatePresence, motion } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { useUIStore } from "@/store/useUIStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { arrivalHostLine } from "@/lib/arrival";
import { resolveLightPreset } from "@/lib/parisWeather";

export function ArrivalOverlay() {
  const mapFlyInComplete = useUIStore((s) => s.mapFlyInComplete);
  const parisConditions = useSceneStore((s) => s.parisConditions);
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);

  const hour = hourOverride ?? parisConditions?.localHour ?? 12;
  const preset = resolveLightPreset(parisConditions, hourOverride);
  const line = arrivalHostLine(hour, preset);
  const visible = !mapFlyInComplete;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="arrival"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 40%, color-mix(in oklab, var(--paper) 88%, transparent), color-mix(in oklab, var(--ink) 12%, transparent))",
          }}
          aria-live="polite"
          aria-label="Welcome to Paris"
        >
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.35 }}
            className="glass-strong mx-6 max-w-md px-8 py-7 text-center"
            style={{
              borderRadius: 28,
              boxShadow: "var(--shadow-panel)",
              border: "1px solid rgba(255,255,255,0.75)",
            }}
          >
            <p
              className="text-[10px] font-medium uppercase"
              style={{ letterSpacing: "0.18em", color: "var(--ink-3)" }}
            >
              Living Paris
            </p>
            <p
              className="mt-3 font-serif leading-snug"
              style={{ fontSize: 26, color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {line}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
