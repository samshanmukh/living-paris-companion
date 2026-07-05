import { motion } from "framer-motion";
import { Accessibility, Camera, CloudRain, Coffee, Heart, ShieldCheck, Users } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import type { MoodType } from "@/lib/types";

const MOODS: {
  key: MoodType;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
  tint: string;
  text: string;
}[] = [
  { key: "romantic",    label: "Romantic",   prompt: "A romantic evening in Paris", icon: Heart,         accent: "#C77E6A", text: "#8B4E3B", tint: "rgba(199,126,106,0.14)" },
  { key: "family",      label: "Family",     prompt: "A relaxed day with kids",     icon: Users,         accent: "#7E9B6E", text: "#4E6A44", tint: "rgba(126,155,110,0.14)" },
  { key: "rainy",       label: "Rainy",      prompt: "Somewhere warm — it's raining", icon: CloudRain,   accent: "#7C93A6", text: "#4B6273", tint: "rgba(124,147,166,0.14)" },
  { key: "photography", label: "Photo walk", prompt: "A beautiful photography walk",  icon: Camera,      accent: "#C79A4E", text: "#8B6A2E", tint: "rgba(199,154,78,0.14)" },
  { key: "relaxing",    label: "Quiet café", prompt: "A slow morning at a quiet café", icon: Coffee,     accent: "#6E9B95", text: "#41625E", tint: "rgba(110,155,149,0.14)" },
];

export function MoodChips() {
  const send = useCityStore((s) => s.send);
  const mood = useCityStore((s) => s.mood);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const idx = items.findIndex((b) => b === document.activeElement);
    if (e.key === "ArrowRight" && idx < items.length - 1) { e.preventDefault(); items[idx + 1].focus(); }
    if (e.key === "ArrowLeft" && idx > 0)                 { e.preventDefault(); items[idx - 1].focus(); }
  };

  return (
    <div
      role="toolbar"
      aria-label="Moods"
      onKeyDown={onKey}
      className="lp-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
    >
      {MOODS.map((m, i) => {
        const Icon = m.icon;
        const active = mood === m.key;
        return (
          <motion.button
            key={m.key}
            type="button"
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.03 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={() => void send(m.prompt)}
            title={m.label}
            aria-label={m.label}
            aria-pressed={active}
            className="inline-flex shrink-0 items-center gap-1.5"
            style={{
              background: active ? m.tint : "var(--paper-2)",
              color: active ? m.text : "var(--ink)",
              borderRadius: "var(--r-pill)",
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${active ? m.accent : "var(--line)"}`,
            }}
          >
            <Icon size={14} strokeWidth={1.7} />
            <span className="whitespace-nowrap">{m.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
