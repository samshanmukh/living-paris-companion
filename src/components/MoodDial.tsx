import { motion } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { useCityStore } from "@/store/useCityStore";
import type { MoodType } from "@/lib/types";

const PERSONAS: { key: string; label: string; mood: MoodType; prompt: string }[] = [
  { key: "flaneur",   label: "Flâneur",   mood: "relaxing",    prompt: "A slow, aimless flâneur walk through Paris" },
  { key: "gourmand",  label: "Gourmand",  mood: "food",        prompt: "A gourmand food crawl for today" },
  { key: "romantic",  label: "Romantic",  mood: "romantic",    prompt: "A romantic Paris evening" },
  { key: "curator",   label: "Curator",   mood: "culture",     prompt: "A cultural, museum-first afternoon" },
  { key: "photog",    label: "Photog",    mood: "photography", prompt: "A photo-walk chasing golden hour" },
  { key: "hunter",    label: "Hunter",    mood: "hidden",      prompt: "Hidden, local Paris — no tourist spots" },
];

export function MoodDial() {
  const persona = useSceneStore((s) => s.persona);
  const setPersona = useSceneStore((s) => s.setPersona);
  const send = useCityStore((s) => s.send);
  const thinking = useCityStore((s) => s.isThinking);

  const step = 360 / PERSONAS.length;
  const currentIdx = Math.max(0, PERSONAS.findIndex((p) => p.key === persona));
  const rotation = -currentIdx * step;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass pointer-events-auto absolute z-20 hidden md:block"
      style={{
        right: 24, bottom: 24,
        width: 116, height: 116,
        borderRadius: "50%",
        boxShadow: "var(--shadow-card)",
        padding: 0,
      }}
      aria-label="Persona dial"
    >
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="absolute inset-0"
      >
        {PERSONAS.map((p, i) => {
          const angle = i * step;
          return (
            <button
              key={p.key}
              type="button"
              disabled={thinking}
              onClick={() => {
                setPersona(p.key);
                void send(p.prompt);
              }}
              className="absolute text-[10px]"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${angle}deg) translateY(-40px) rotate(${-angle - rotation}deg) translate(-50%, -50%)`,
                transformOrigin: "0 0",
                color: p.key === persona ? "var(--accent-text)" : "var(--ink-2)",
                fontWeight: p.key === persona ? 600 : 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                padding: 2,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </motion.div>
      {/* center dot */}
      <div
        className="absolute grid place-items-center"
        style={{
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          color: "var(--paper-2)",
          fontSize: 9,
          letterSpacing: "0.16em",
          fontWeight: 600,
        }}
      >
        MOOD
      </div>
    </motion.div>
  );
}
