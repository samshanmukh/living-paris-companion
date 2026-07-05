import { AnimatePresence, motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { usePrefsStore } from "@/store/usePrefsStore";

const STEPS = [
  { key: "intent", label: "Understanding intent" },
  { key: "score", label: "Scoring 1,240 places" },
  { key: "filter", label: "Filtering by distance" },
  { key: "redraw", label: "Redrawing your Paris" },
] as const;

function dotColor(active: boolean, done: boolean) {
  if (done) return "#5CB87A";
  if (active) return "#E8A54B";
  return "rgba(255,255,255,0.35)";
}

export function PipelineViz() {
  const thinking = useCityStore((s) => s.isThinking);
  const step = useCityStore((s) => s.pipelineStep);
  const hasSent = useCityStore((s) => s.hasSent);
  const showDebug = usePrefsStore((s) => s.showDebugControls);

  const visible = thinking && hasSent && (showDebug || import.meta.env.DEV);

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: 16, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="pointer-events-none fixed z-30 hidden sm:block"
          style={{
            top: "calc(72px + env(safe-area-inset-top))",
            right: 16,
            width: 240,
            padding: "14px 16px",
            borderRadius: 16,
            background: "rgba(42, 36, 32, 0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px) saturate(140%)",
            boxShadow: "0 16px 40px rgba(28,26,22,0.28)",
          }}
          aria-live="polite"
          aria-label="Paris is thinking"
        >
          <ul className="flex flex-col gap-2.5">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.key} className="flex items-center gap-2.5">
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: dotColor(active, done),
                      boxShadow: active ? "0 0 8px rgba(232,165,75,0.6)" : undefined,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: active ? 600 : 500,
                      color: done || active ? "rgba(253,251,246,0.95)" : "rgba(253,251,246,0.45)",
                      lineHeight: 1.3,
                    }}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <p
            className="mt-3 pt-2"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(253,251,246,0.35)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            intent → score → filter → mapbox
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
