import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useCityStore } from "@/store/useCityStore";
import { InputBar } from "./InputBar";
import { MessageBubble } from "./MessageBubble";
import { MoodChips } from "./MoodChips";
import { ThinkingIndicator } from "./ThinkingIndicator";

export function ChatPanel() {
  const messages = useCityStore((s) => s.messages);
  const isThinking = useCityStore((s) => s.isThinking);
  const hasSent = useCityStore((s) => s.hasSent);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isThinking]);

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
      className="glass pointer-events-auto absolute z-20 flex flex-col
        inset-x-3 bottom-3 top-[42%]
        sm:inset-auto sm:left-6 sm:top-6 sm:bottom-6 sm:w-[360px]"
      style={{
        borderRadius: "var(--r-panel)",
        boxShadow: "var(--shadow-panel)",
        padding: "20px 20px calc(20px + env(safe-area-inset-bottom)) 20px",
        gap: 16,
      }}
    >
      {/* Mobile drag handle */}
      <div
        aria-hidden
        className="mx-auto sm:hidden"
        style={{
          width: 40, height: 4, borderRadius: 999,
          background: "var(--line-strong)", marginTop: -6, marginBottom: 2,
        }}
      />

      {/* Brand — small, restrained */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-full"
          style={{ background: "var(--accent)" }}
        />
        <span
          className="text-[12px] uppercase"
          style={{ color: "var(--ink-2)", fontWeight: 500, letterSpacing: "0.14em" }}
        >
          Living Paris
        </span>
      </div>

      {/* Serif hero (empty state) */}
      <AnimatePresence>
        {!hasSent && (
          <motion.h1
            key="hero"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="font-serif"
            style={{
              fontSize: 32,
              lineHeight: 1.05,
              color: "var(--ink)",
              letterSpacing: "-0.015em",
            }}
          >
            What kind of Paris are you in the mood for
            <span className="italic" style={{ color: "var(--accent-text)" }}>?</span>
          </motion.h1>
        )}
      </AnimatePresence>

      {/* Transcript */}
      <div ref={scrollRef} className="lp-scroll flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.text} places={m.places} />
          ))}
        </AnimatePresence>
        {isThinking && <ThinkingIndicator />}
      </div>

      {/* Mood chips (collapse after first send) */}
      <AnimatePresence>
        {!hasSent && (
          <motion.div
            key="chips"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <MoodChips />
          </motion.div>
        )}
      </AnimatePresence>

      <InputBar />
    </motion.aside>
  );
}
