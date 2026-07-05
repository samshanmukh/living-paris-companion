import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { DEFAULT_SUGGESTIONS, starterSuggestions, suggestionsForMood, type Suggestion } from "@/lib/suggestions";
import type { MoodType } from "@/lib/types";

interface Props {
  /** Override suggestions; defaults to mood-based or starter set. */
  items?: Suggestion[];
  disabled?: boolean;
}

export function SuggestionChips({ items, disabled }: Props) {
  const send = useCityStore((s) => s.send);
  const startRoute = useCityStore((s) => s.startRoute);
  const mood = useCityStore((s) => s.mood);
  const hasSent = useCityStore((s) => s.hasSent);
  const isThinking = useCityStore((s) => s.isThinking);
  const userLocation = useCityStore((s) => s.userLocation);

  const chips = items ?? (hasSent ? suggestionsForMood(mood as MoodType) : starterSuggestions(Boolean(userLocation)));

  return (
    <div
      role="toolbar"
      aria-label="Suggestions"
      className="lp-scroll flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1"
    >
      {chips.map((s, i) => (
        <motion.button
          key={s.label}
          type="button"
          disabled={disabled || isThinking}
          initial={{ opacity: 0, y: 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24, delay: i * 0.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => (s.action === "start-route" ? void startRoute() : void send(s.prompt))}
          className="shrink-0 rounded-full font-medium transition-opacity disabled:opacity-45"
          style={{
            padding: "10px 18px",
            fontSize: 14,
            letterSpacing: "-0.01em",
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(255,255,255,0.85)",
            color: "var(--ink)",
            boxShadow: "0 4px 14px rgba(28,26,22,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {s.label}
        </motion.button>
      ))}
    </div>
  );
}
