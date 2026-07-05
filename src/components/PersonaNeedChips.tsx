import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import { PERSONA_NEED_CHIPS } from "@/lib/personas";
import { applyPersonaDefaults } from "@/lib/personaDefaults";

/** Three compact “I need…” persona chips — shown before the first message. */
export function PersonaNeedChips() {
  const hasSent = useCityStore((s) => s.hasSent);
  const isThinking = useCityStore((s) => s.isThinking);
  const send = useCityStore((s) => s.send);
  const setActivePersona = useUIStore((s) => s.setActivePersona);
  const setChatOpen = useUIStore((s) => s.setChatOpen);

  if (hasSent) return null;

  const pick = (key: (typeof PERSONA_NEED_CHIPS)[number]) => {
    setActivePersona(key.key);
    applyPersonaDefaults(key.key);
    setChatOpen(true);
    void send(key.prompt);
  };

  return (
    <div className="mb-3">
      <p
        className="mb-2 text-[11px] font-medium uppercase"
        style={{ letterSpacing: "0.12em", color: "var(--ink-3)" }}
      >
        Or tell me what you need
      </p>
      <div
        role="toolbar"
        aria-label="Accessibility and dietary needs"
        className="lp-scroll flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1"
      >
        {PERSONA_NEED_CHIPS.map((p, i) => (
          <motion.button
            key={p.key}
            type="button"
            disabled={isThinking}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.05, type: "spring", stiffness: 320, damping: 26 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => pick(p)}
            className="shrink-0 rounded-full font-medium disabled:opacity-45"
            style={{
              padding: "9px 16px",
              fontSize: 13,
              letterSpacing: "-0.01em",
              background: "color-mix(in oklab, var(--accent) 10%, rgba(255,255,255,0.72))",
              border: "1px solid var(--accent-line)",
              color: "var(--accent-text)",
              boxShadow: "0 4px 14px rgba(28,26,22,0.06)",
            }}
          >
            {p.needChip}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
