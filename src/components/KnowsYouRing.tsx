import { motion, AnimatePresence } from "framer-motion";
import { useTraitsStore, selectKnowsYou } from "@/store/useTraitsStore";
import { useUIStore } from "@/store/useUIStore";
import { TRAIT_LABELS, type Trait } from "@/lib/traitsExtractor";
import { belowTopBar, topBarRight } from "@/lib/layout";

export function KnowsYouRing() {
  const pct = useTraitsStore(selectKnowsYou);
  const traits = useTraitsStore((s) => s.traits);
  const lastAdded = useTraitsStore((s) => s.lastAdded);
  const ready = useTraitsStore((s) => s.ready);
  const destination = useUIStore((s) => s.destination);
  if (!ready || destination) return null;

  const size = 44;
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const top: Trait[] = (Object.entries(traits) as [Trait, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 140, damping: 20 }}
      className="glass pointer-events-auto fixed z-20 hidden lg:flex items-center gap-3 max-w-[min(280px,calc(100vw-130px))]"
      style={{
        top: belowTopBar(),
        right: topBarRight(),
        padding: "8px 14px 8px 8px",
        borderRadius: 999,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={3} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke="var(--accent)" strokeWidth={3} strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-[10px]" style={{ color: "var(--ink)", fontWeight: 600 }}>
          {pct}%
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase" style={{ color: "var(--ink-3)", letterSpacing: "0.14em" }}>
          Paris knows you
        </span>
        <div className="flex gap-1 mt-0.5">
          <AnimatePresence mode="popLayout">
            {top.length === 0 ? (
              <span className="text-[11px] italic" style={{ color: "var(--ink-2)" }}>learning…</span>
            ) : top.map((t) => (
              <motion.span
                key={t}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-[11px]"
                style={{
                  color: lastAdded.includes(t) ? "var(--accent-text)" : "var(--ink-2)",
                  fontWeight: lastAdded.includes(t) ? 600 : 400,
                }}
              >
                {TRAIT_LABELS[t]}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
