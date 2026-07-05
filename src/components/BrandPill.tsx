import { motion } from "framer-motion";

export function BrandPill() {
  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 220, damping: 22 }}
      className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2"
    >
      <div
        className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5"
        style={{
          background: "var(--glass-strong)",
          backdropFilter: "var(--blur)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-pill)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <span
          className="font-display grid size-6 place-items-center rounded-full"
          style={{ background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 800 }}
        >
          P
        </span>
        <span
          className="font-display"
          style={{ fontSize: 14, color: "var(--ink)", fontWeight: 700, letterSpacing: "-0.005em" }}
        >
          Living Paris
        </span>
      </div>
    </motion.div>
  );
}
