import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCityStore } from "@/store/useCityStore";
import { VoiceInput } from "./VoiceInput";

export function InputBar() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const send = useCityStore((s) => s.send);
  const isThinking = useCityStore((s) => s.isThinking);

  const submit = () => {
    const v = value.trim();
    if (!v || isThinking) return;
    setValue("");
    void send(v);
  };

  return (
    <motion.form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      animate={{
        boxShadow: focused
          ? "0 0 0 3px var(--accent-tint), var(--shadow-card)"
          : "var(--shadow-soft)",
        borderColor: focused ? "var(--accent-line)" : "var(--line)",
      }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2"
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-pill)",
        padding: "8px 8px 8px 18px",
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Talk to Paris…"
        className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[color:var(--ink-3)]"
        style={{ color: "var(--ink)" }}
        aria-label="Talk to Paris"
      />
      <VoiceInput onFinal={(t) => void send(t)} />
      <motion.button
        type="submit"
        aria-label="Send"
        disabled={isThinking || !value.trim()}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        className="grid size-9 place-items-center rounded-full disabled:opacity-40"
        style={{
          background: "var(--ink)",
          color: "var(--paper-2)",
          boxShadow: "0 4px 12px rgba(28,26,22,0.24)",
        }}
      >
        <ArrowUp size={16} strokeWidth={2.4} />
      </motion.button>
    </motion.form>
  );
}
