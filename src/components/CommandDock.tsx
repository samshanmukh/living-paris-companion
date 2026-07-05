import { useEffect, useRef, useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Mic } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { MOOD_THEMES } from "@/lib/moods";
import { bottomSafe, LAYOUT } from "@/lib/layout";

/**
 * Minimizable chat panel. Sits directly under the floating voice orb.
 * Open/closed state is shared via useUIStore so the voice orb can react.
 */
export function CommandDock() {
  const open = useUIStore((s) => s.chatOpen);
  const setOpen = useUIStore((s) => s.setChatOpen);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useCityStore((s) => s.messages);
  const mood = useCityStore((s) => s.mood);
  const isThinking = useCityStore((s) => s.isThinking);
  const liveTranscript = useCityStore((s) => s.liveTranscript);
  const send = useCityStore((s) => s.send);
  const { listening: micOn, toggle: toggleMic } = useVoiceInput();

  useEffect(() => {
    const el = scrollRef.current;
    if (open && el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking, liveTranscript, open]);

  const previewLine = useMemo(() => {
    if (liveTranscript) return `"${liveTranscript}"`;
    if (isThinking) return "Thinking…";
    const lastAI = [...messages].reverse().find((m) => m.role === "ai");
    if (lastAI) return lastAI.text;
    return (MOOD_THEMES[mood]?.line ?? MOOD_THEMES.general.line);
  }, [liveTranscript, isThinking, messages, mood]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    void send(t);
    setOpen(true);
  };


  // Collapsed pill — sits directly under the voice orb
  if (!open) {
    return (
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="pointer-events-auto fixed z-40 left-1/2 -translate-x-1/2 flex items-center gap-2.5 rounded-full"
        style={{
          bottom: bottomSafe(LAYOUT.chatCollapsedBottom - LAYOUT.bottomInset),
          maxWidth: "min(340px, calc(100vw - 96px))",
          padding: "9px 14px 9px 11px",
          background: "rgba(255,255,255,0.42)",
          border: "1px solid rgba(255,255,255,0.55)",
          backdropFilter: "blur(18px) saturate(160%)",
          boxShadow: "0 10px 26px rgba(28,26,22,0.16)",
        }}
      >
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}
        >
          <MessageSquare size={13} strokeWidth={2} />
        </span>
        <span
          className="truncate text-left"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: liveTranscript ? "var(--accent-text)" : "var(--ink-2)",
            letterSpacing: "-0.005em",
            maxWidth: 240,
          }}
        >
          {previewLine}
        </span>
      </motion.button>
    );
  }

  // Expanded — anchored to bottom, sits below the voice orb (orb at ~220px)
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="pointer-events-auto fixed z-40 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] flex flex-col"
      style={{
        bottom: bottomSafe(LAYOUT.chatExpandedBottom - LAYOUT.bottomInset),
        maxHeight: "min(320px, calc(50vh - 80px))",
        borderRadius: 22,
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(255,255,255,0.6)",
        backdropFilter: "blur(24px) saturate(170%)",
        boxShadow: "0 20px 60px rgba(28,26,22,0.22)",
        overflow: "hidden",
      }}
      role="region"
      aria-label="Chat with Paris"
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full"
            style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}
          >
            <MessageSquare size={12} strokeWidth={2} />
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "0.02em" }}>
            Paris
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Minimize chat"
          className="grid size-7 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.6)", color: "var(--ink-2)" }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2.5 lp-scroll"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 && !isThinking && (
          <p style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500, lineHeight: 1.5 }}>
            {(MOOD_THEMES[mood]?.line ?? MOOD_THEMES.general.line)}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {messages.slice(-8).map((m, i) => (
              <motion.div
                key={`${messages.length - 8 + i}-${m.role}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <span
                  className="inline-block"
                  style={{
                    padding: "7px 12px",
                    borderRadius: 14,
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 78%, black))"
                        : "rgba(255,255,255,0.7)",
                    color: m.role === "user" ? "var(--paper-2)" : "var(--ink)",
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.42,
                    maxWidth: "86%",
                  }}
                >
                  {m.text}
                </span>
              </motion.div>
            ))}
            {isThinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start items-center gap-1.5"
              >
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }}
                />
                <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>Thinking…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="shrink-0 flex items-center gap-2 px-3 py-2.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.5)" }}
      >
        <motion.button
          type="button"
          onClick={toggleMic}
          whileTap={{ scale: 0.92 }}
          aria-label={micOn ? "Stop listening" : "Speak"}
          aria-pressed={micOn}
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{
            background: micOn
              ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))"
              : "rgba(255,255,255,0.75)",
            color: micOn ? "var(--paper-2)" : "var(--ink)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: micOn
              ? "0 6px 16px color-mix(in oklab, var(--accent) 35%, transparent)"
              : "none",
          }}
        >
          <Mic size={14} strokeWidth={2} />
        </motion.button>
        <div
          className="flex-1 flex items-center gap-2 rounded-full"
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.7)",
            padding: "5px 5px 5px 13px",
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            aria-label="Message Paris"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", minWidth: 0 }}
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.92 }}
            disabled={!draft.trim()}
            aria-label="Send"
            className="grid size-7 shrink-0 place-items-center rounded-full transition-opacity"
            style={{
              background: draft.trim()
                ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))"
                : "rgba(255,255,255,0.5)",
              color: draft.trim() ? "var(--paper-2)" : "var(--ink-3)",
              opacity: draft.trim() ? 1 : 0.6,
            }}
          >
            <Send size={12} strokeWidth={2} />
          </motion.button>
        </div>
      </form>
    </motion.aside>
  );
}
