import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { bottomSafe, LAYOUT } from "@/lib/layout";

/**
 * Floating glass voice orb. Hidden when the chat panel is open — a mic
 * button is rendered inline inside the chat form instead (see CommandDock).
 * Position is 100% fixed with no layout animation.
 */
export function VoiceOrb() {
  const chatOpen = useUIStore((s) => s.chatOpen);
  const { listening, transcript, toggle } = useVoiceInput();

  if (chatOpen) return null;

  const size = 72;
  const iconSize = 24;

  return (
    <div
      className="pointer-events-auto fixed z-50 left-1/2 -translate-x-1/2"
      style={{
        bottom: bottomSafe(LAYOUT.voiceOrbBottom - LAYOUT.bottomInset),
        width: size,
        height: size,
      }}
    >
      <AnimatePresence>
        {listening && (
          <>
            {[0, 0.45, 0.9].map((delay, i) => (
              <motion.span
                key={i}
                aria-hidden
                initial={{ opacity: 0.4, scale: 1 }}
                animate={{ opacity: 0, scale: 1.55 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: "1px solid rgba(255,255,255,0.45)",
                  background:
                    "radial-gradient(circle, color-mix(in oklab, var(--accent) 35%, transparent) 0%, transparent 70%)",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggle}
        aria-label={listening ? "Stop listening" : "Speak"}
        whileTap={{ scale: 0.96 }}
        animate={{
          scale: listening ? [1, 1.05, 1] : [1, 1.008, 1],
        }}
        transition={
          listening
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          border: "1px solid rgba(255,255,255,0.55)",
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 65%, rgba(255,255,255,0.02))",
          backdropFilter: "blur(22px) saturate(160%)",
          boxShadow: listening
            ? "0 18px 40px color-mix(in oklab, var(--accent) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.6)"
            : "0 14px 34px rgba(28,26,22,0.20), inset 0 1px 0 rgba(255,255,255,0.5)",
          color: "var(--ink)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-1.5 rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(255,255,255,0.28)" }}
        />
        <Mic
          size={iconSize}
          strokeWidth={1.9}
          style={{
            color: listening ? "var(--accent-text)" : "var(--ink)",
            opacity: 0.9,
            position: "relative",
            zIndex: 1,
          }}
        />
      </motion.button>

      <AnimatePresence>
        {listening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="glass-strong absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 130,
              padding: "10px 16px",
              borderRadius: 16,
              boxShadow: "var(--shadow-panel)",
              minWidth: 220,
              maxWidth: 320,
              border: "1px solid var(--line-strong)",
            }}
          >
            <p className="text-center truncate" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              {transcript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
