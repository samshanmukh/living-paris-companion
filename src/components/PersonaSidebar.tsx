import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Accessibility, Heart, Ear, Moon, Menu, X, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore, type PersonaKey } from "@/store/useUIStore";
import { LAYOUT, topSafe } from "@/lib/layout";

type Persona = {
  key: PersonaKey;
  label: string;
  Icon: LucideIcon;
  prompt: string;
};

const PERSONAS: Persona[] = [
  { key: "asthma",     label: "Asthma",       Icon: Wind,          prompt: "I have asthma. Plan a 45-min walk staying on streets with the cleanest air today (avoid rue de Rivoli, Bd Périphérique, Champs-Élysées). Prefer parks (Buttes-Chaumont, Monceau, Luxembourg) and pedestrian streets. Give me 3 specific stops with why each is low-pollution." },
  { key: "wheelchair", label: "Wheelchair",   Icon: Accessibility, prompt: "I use a manual wheelchair. Give me 3 fully step-free places within 20 min of Châtelet, only via lift-equipped métro (14, or RER A/B/D with elevators). No cobblestone streets. List each venue's step-free entrance detail." },
  { key: "sensory",    label: "Sensory",      Icon: Ear,           prompt: "I'm autistic and noise-sensitive. Give me 3 quiet spots today (under 55 dB): think Square du Vert-Galant, Musée de la Vie Romantique courtyard, Coulée verte René-Dumont. Route between them on backstreets, not boulevards." },
  { key: "safety",     label: "Night safety", Icon: Moon,          prompt: "It's 11pm and I'm walking alone. Route me from where I am to Gare du Nord along the best-lit streets with venues still open (24h boulangeries, late bars). Avoid Château Rouge, Barbès, and unlit park edges. Name the streets." },
  { key: "halal",      label: "Halal",        Icon: Utensils,      prompt: "I eat halal only. Give me 3 halal restaurants in Paris (11e, 10e, 18e), the nearest mosque or prayer room to each, and the next Maghrib prayer time window." },
  { key: "date",       label: "Date night",   Icon: Heart,         prompt: "Plan a romantic date night tonight in the 11th or 4th: a natural-wine bar, a candlelit bistro (€€), and a quiet Seine walk to end. Walkable loop under 1.2 km. Name the specific venues." },
];

export function PersonaSidebar() {
  const [open, setOpen] = useState(false);
  const active = useUIStore((s) => s.activePersona);
  const setActivePersona = useUIStore((s) => s.setActivePersona);
  const send = useCityStore((s) => s.send);
  const setChatOpen = useUIStore((s) => s.setChatOpen);

  const pick = (p: Persona) => {
    setActivePersona(p.key);
    setOpen(false);
    setChatOpen(true);
    void send(p.prompt);
  };


  return (
    <div
      className="pointer-events-auto fixed z-40"
      style={{ top: topSafe(), left: LAYOUT.inset }}
    >
      {/* Hamburger toggle */}
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

      {/* Expanded rail */}
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
                    <p.Icon size={15} strokeWidth={1.9} />
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
