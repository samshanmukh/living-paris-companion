import { AnimatePresence, motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { belowTopBar } from "@/lib/layout";

export function WhatChangedChips() {
  const changed = useCityStore((s) => s.lastChanged);
  return (
    <AnimatePresence>
      {changed.length > 0 && (
        <motion.div
          key={changed.join(",")}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="pointer-events-none fixed z-20 hidden sm:flex items-center gap-1.5 left-1/2 -translate-x-1/2"
          style={{ top: belowTopBar(36) }}
        >
          {changed.map((label, i) => (
            <motion.span
              key={`${label}-${i}`}
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
              className="glass text-[11px]"
              style={{
                padding: "5px 10px",
                borderRadius: 999,
                color: "var(--accent-text)",
                border: "1px solid var(--accent-line)",
                background: "var(--accent-tint)",
                fontWeight: 500,
              }}
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
