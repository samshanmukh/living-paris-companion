import { motion } from "framer-motion";
import { useRef } from "react";
import { useTraitsStore, selectKnowsYou } from "@/store/useTraitsStore";
import { useUIStore } from "@/store/useUIStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { personaByKey } from "@/lib/personas";
import { ParisSkyIndicator } from "./ParisSkyIndicator";
import { topSafe } from "@/lib/layout";

export function LivingParisBadge() {
  const pct = useTraitsStore(selectKnowsYou);
  const ready = useTraitsStore((s) => s.ready);
  const activePersona = useUIStore((s) => s.activePersona);
  const persona = personaByKey(activePersona);
  const PersonaIcon = persona?.Icon;
  const showGettingToKnow = (ready ? pct : 0) === 0;
  const toggleDebug = usePrefsStore((s) => s.toggleDebugControls);
  const clickTimes = useRef<number[]>([]);

  const onBadgeClick = () => {
    const now = Date.now();
    clickTimes.current = [...clickTimes.current.filter((t) => now - t < 700), now];
    if (clickTimes.current.length >= 3) {
      clickTimes.current = [];
      toggleDebug();
    }
  };

  const size = 36;
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - (ready ? pct : 0) / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.2 }}
      className="pointer-events-auto fixed z-30 left-1/2 -translate-x-1/2"
      style={{ top: topSafe(4) }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onBadgeClick}
        onKeyDown={(e) => e.key === "Enter" && onBadgeClick()}
        className="glass-strong flex items-center gap-2.5 rounded-full cursor-default"
        style={{
          padding: "6px 14px 6px 8px",
          boxShadow: "var(--shadow-glass)",
          border: "1px solid rgba(255,255,255,0.75)",
        }}
      >
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          {PersonaIcon ? (
            <span
              className="absolute inset-0 grid place-items-center rounded-full"
              style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}
              aria-label={persona?.label}
            >
              <PersonaIcon size={16} strokeWidth={2} />
            </span>
          ) : (
            <>
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
                  initial={{ strokeDashoffset: c }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </svg>
              <span
                className="absolute inset-0 grid place-items-center"
                style={{ fontSize: 9, fontWeight: 700, color: "var(--ink)" }}
              >
                {showGettingToKnow ? "·" : `${ready ? pct : 0}%`}
              </span>
            </>
          )}
        </div>
        <span
          className="font-serif whitespace-nowrap"
          style={{ fontSize: 15, color: "var(--ink)", letterSpacing: "-0.01em" }}
        >
          {showGettingToKnow ? "Getting to know you" : "Living Paris"}
        </span>
        <ParisSkyIndicator />
      </div>
    </motion.div>
  );
}
