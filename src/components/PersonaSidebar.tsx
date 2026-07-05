import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import { PERSONAS } from "@/lib/personas";
import { applyPersonaDefaults } from "@/lib/personaDefaults";
import { LAYOUT, topSafe } from "@/lib/layout";

export function PersonaSidebar() {
  const [open, setOpen] = useState(false);
  const active = useUIStore((s) => s.activePersona);
  const setActivePersona = useUIStore((s) => s.setActivePersona);
  const send = useCityStore((s) => s.send);
  const setChatOpen = useUIStore((s) => s.setChatOpen);

  const pick = (p: (typeof PERSONAS)[number]) => {
    setActivePersona(p.key);
    applyPersonaDefaults(p.key);
    setOpen(false);
    setChatOpen(true);
    void send(p.prompt);
  };

  return (
    <div
      className="pointer-events-auto fixed z-40"
      style={{ top: topSafe(), left: LAYOUT.inset }}
    >
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Close personas" : "Open personas"}
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-full"
        style={{
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px) saturate(160%)",
          boxShadow: "0 10px 26px rgba(28,26,22,0.16)",
          color: "var(--ink)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <X size={19} strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span
              key="m"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Menu size={19} strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="rail"
            initial={{ opacity: 0, y: -6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="mt-2 flex flex-col gap-1.5 rounded-3xl"
            style={{
              padding: 7,
              background: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(20px) saturate(160%)",
              boxShadow: "0 14px 34px rgba(28,26,22,0.18)",
              transformOrigin: "top left",
            }}
          >
            {PERSONAS.map((p, i) => {
              const isActive = active === p.key;
              const Icon = p.Icon;
              return (
                <motion.button
                  key={p.key}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 320, damping: 26 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => pick(p)}
                  aria-pressed={isActive}
                  className="flex items-center gap-2.5 rounded-full pr-3.5"
                  style={{
                    paddingLeft: 6,
                    paddingTop: 5,
                    paddingBottom: 5,
                    background: isActive ? "var(--accent)" : "transparent",
                    color: isActive ? "var(--paper-2)" : "var(--ink)",
                    boxShadow: isActive
                      ? "0 6px 16px color-mix(in oklab, var(--accent) 40%, transparent)"
                      : "none",
                  }}
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-full"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
                      color: isActive ? "var(--paper-2)" : "var(--ink)",
                    }}
                  >
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.005em" }}>
                    {p.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
