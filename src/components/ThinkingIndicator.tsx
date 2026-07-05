import { motion } from "framer-motion";

export function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="inline-flex items-center gap-1.5"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-1.5 rounded-full"
          style={{
            background: "var(--accent)",
            animation: `lp-dot-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
      <span className="ml-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
        Paris is thinking…
      </span>
    </motion.div>
  );
}
