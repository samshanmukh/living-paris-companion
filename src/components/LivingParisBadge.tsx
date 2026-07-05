import { motion } from "framer-motion";
import { useTraitsStore, selectKnowsYou } from "@/store/useTraitsStore";
import { topSafe } from "@/lib/layout";

export function LivingParisBadge() {
  const pct = useTraitsStore(selectKnowsYou);
  const ready = useTraitsStore((s) => s.ready);

  const size = 36;
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - (ready ? pct : 0) / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.2 }}
      className="pointer-events-none fixed z-30 left-1/2 -translate-x-1/2"
      style={{ top: topSafe(4) }}
    >
      <div
        className="glass-strong flex items-center gap-2.5 rounded-full"
        style={{
          padding: "6px 14px 6px 8px",
          boxShadow: "var(--shadow-glass)",
          border: "1px solid rgba(255,255,255,0.75)",
        }}
      >
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={2.5} />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={c}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <span
            className="absolute inset-0 grid place-items-center"
            style={{ fontSize: 9, fontWeight: 700, color: "var(--ink)" }}
          >
            {ready ? pct : 0}%
          </span>
        </div>
        <span
          className="font-serif whitespace-nowrap"
          style={{ fontSize: 15, color: "var(--ink)", letterSpacing: "-0.01em" }}
        >
          Living Paris
        </span>
      </div>
    </motion.div>
  );
}
