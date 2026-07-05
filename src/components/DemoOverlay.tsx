import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useDemoStore } from "@/store/useDemoStore";
import { DEMO_END, DEMO_ROUTES, DEMO_START } from "@/lib/demoRoutes";
import { aboveBottomChrome, belowTopBar, LAYOUT } from "@/lib/layout";

export function DemoOverlay() {
  const active = useDemoStore((s) => s.active);
  const toggle = useDemoStore((s) => s.toggle);
  const deactivate = useDemoStore((s) => s.deactivate);

  return (
    <>
      <button
        onClick={toggle}
        className="glass-strong pointer-events-auto fixed z-30 inline-flex items-center gap-2"
        style={{
          top: belowTopBar(LAYOUT.personaBtn + 4),
          left: LAYOUT.inset,
          padding: "8px 12px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink)",
          boxShadow: "var(--shadow-card)",
          border: active ? "1px solid var(--accent)" : undefined,
        }}
      >
        <Sparkles size={14} strokeWidth={1.8} style={{ color: "var(--accent-text)" }} />
        {active ? "Demo Data · on" : "Demo Data"}
      </button>

      <AnimatePresence>
        {active && (
          <>
            {/* Legend — right side */}
            <motion.div
              key="legend"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              className="glass-strong pointer-events-auto fixed z-30"
              style={{
                top: belowTopBar(LAYOUT.topBarH + 8),
                left: LAYOUT.inset,
                width: "min(300px, calc(100vw - 24px))",
                padding: 14,
                borderRadius: 18,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div style={{ fontSize: 11, letterSpacing: 0.6, color: "var(--ink-3)", textTransform: "uppercase" }}>
                  {DEMO_START.name} → {DEMO_END.name}
                </div>
                <button
                  onClick={deactivate}
                  style={{ color: "var(--ink-3)" }}
                  aria-label="Close demo"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {DEMO_ROUTES.map((r) => (
                  <div key={r.key} className="flex items-start gap-2.5">
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 3,
                        marginTop: 8,
                        borderRadius: 2,
                        background: r.color,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.35 }}>
                        {r.reason}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}>
                        {r.distanceKm} km · {r.minutes} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bottom card */}
            <motion.div
              key="bottom"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
              className="glass-strong pointer-events-auto fixed z-30 left-1/2 -translate-x-1/2"
              style={{
                bottom: aboveBottomChrome(8),
                padding: "12px 22px",
                borderRadius: 999,
                boxShadow: "var(--shadow-card)",
                textAlign: "center",
                maxWidth: "min(92vw, 420px)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                Same destination. Different needs. Different safest path.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
