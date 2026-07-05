import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraitsStore } from "@/store/useTraitsStore";
import { TRAIT_LABELS, type Trait } from "@/lib/traitsExtractor";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { MOOD_THEMES } from "@/lib/moods";
import { SuggestionChips } from "./SuggestionChips";
import { bottomSafe } from "@/lib/layout";

const PIPELINE_LABELS = [
  "Understanding intent",
  "Scoring places",
  "Filtering by distance",
  "Redrawing your Paris",
] as const;

function learnedLine(traits: Record<Trait, number>): string | null {
  const top = (Object.entries(traits) as [Trait, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => TRAIT_LABELS[t]);
  if (!top.length) return null;
  return `Learned: ${top.join(" · ")}`;
}

export function ConversationalPanel() {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useCityStore((s) => s.messages);
  const mood = useCityStore((s) => s.mood);
  const isThinking = useCityStore((s) => s.isThinking);
  const pipelineStep = useCityStore((s) => s.pipelineStep);
  const liveTranscript = useCityStore((s) => s.liveTranscript);
  const hasSent = useCityStore((s) => s.hasSent);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);
  const send = useCityStore((s) => s.send);
  const select = useCityStore((s) => s.select);
  const assistantExpanded = useUIStore((s) => s.assistantExpanded);
  const traits = useTraitsStore((s) => s.traits);
  const guestName = useTraitsStore((s) => s.profile.name);

  const { listening, toggle: toggleMic } = useVoiceInput();

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAI = [...messages].reverse().find((m) => m.role === "ai");
  const learned = learnedLine(traits);
  const expanded = assistantExpanded || routePreviewPlaying;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking, liveTranscript, expanded]);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const t = draft.trim();
    if (!t || isThinking) return;
    setDraft("");
    void send(t);
  };

  return (
    <motion.section
      initial={{ y: 40, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        maxHeight: expanded ? "min(58vh, 480px)" : "min(46vh, 380px)",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 28, delay: 0.15 }}
      className="pointer-events-auto fixed z-50 inset-x-0 flex flex-col"
      style={{
        bottom: 0,
        paddingBottom: bottomSafe(0),
      }}
      role="region"
      aria-label="Talk to Paris"
    >
      <div
        className="mx-3 flex min-h-0 flex-1 flex-col overflow-hidden sm:mx-auto sm:w-[min(440px,calc(100vw-24px))]"
        style={{
          borderRadius: "28px 28px 22px 22px",
          background: "rgba(253, 251, 246, 0.78)",
          border: "1px solid rgba(255,255,255,0.85)",
          backdropFilter: "blur(32px) saturate(180%)",
          boxShadow: "0 -8px 48px rgba(28,26,22,0.14), 0 24px 60px rgba(28,26,22,0.12)",
        }}
      >
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-3 lp-scroll">
          <AnimatePresence mode="popLayout">
            {expanded && routePreviewPlaying && (
              <motion.p
                key="living-hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 rounded-2xl px-3.5 py-2.5"
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--accent-text)",
                  background: "var(--accent-tint)",
                  border: "1px solid var(--accent-line)",
                }}
              >
                I'm walking you through each place — ask me anything below.
              </motion.p>
            )}

            {!hasSent && !isThinking && !expanded && (
              <motion.p
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-serif leading-snug"
                style={{ fontSize: 22, color: "var(--ink)", marginBottom: 16 }}
              >
                {guestName ? `${guestName} — ` : ""}
                {MOOD_THEMES[mood]?.line ?? MOOD_THEMES.general.line}
              </motion.p>
            )}

            {lastUser && (
              <motion.div
                key={`u-${lastUser.text}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-3 flex justify-end"
              >
                <span
                  className="inline-block max-w-[88%] rounded-2xl px-4 py-2.5"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 75%, #1C1A16))",
                    color: "var(--paper-2)",
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: 1.45,
                    boxShadow: "0 6px 20px color-mix(in oklab, var(--accent) 28%, transparent)",
                  }}
                >
                  {lastUser.text}
                </span>
              </motion.div>
            )}

            {lastAI && !isThinking && (
              <motion.div
                key={`a-${lastAI.text}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex gap-3"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full font-serif"
                  style={{
                    background: "var(--accent-tint)",
                    color: "var(--accent-text)",
                    fontSize: 16,
                    border: "1px solid var(--accent-line)",
                  }}
                  aria-hidden
                >
                  P
                </span>
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.5 }}>
                    {lastAI.text}
                  </p>
                  {learned && (
                    <p className="mt-1.5" style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>
                      {learned}
                    </p>
                  )}
                  {lastAI.places && lastAI.places.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {lastAI.places.map((place) => (
                        <button
                          key={place.properties.id}
                          type="button"
                          onClick={() => select(place)}
                          className="rounded-full px-3 py-1.5"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--accent-text)",
                            background: "var(--accent-tint)",
                            border: "1px solid var(--accent-line)",
                          }}
                        >
                          {place.properties.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {isThinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-2 flex items-center gap-2"
              >
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      style={{ width: 5, height: 5, borderRadius: 999, background: "var(--accent)" }}
                    />
                  ))}
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
                  {PIPELINE_LABELS[pipelineStep] ?? "Thinking…"}…
                </span>
              </motion.div>
            )}

            {liveTranscript && (
              <motion.p
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-2 italic"
                style={{ fontSize: 13, color: "var(--accent-text)" }}
              >
                "{liveTranscript}"
              </motion.p>
            )}
          </AnimatePresence>

          {!isThinking && (
            <div className="mt-2">
              <SuggestionChips />
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="shrink-0 flex items-center gap-2 border-t px-4 py-3"
          style={{ borderColor: "rgba(255,255,255,0.55)" }}
        >
          <motion.button
            type="button"
            onClick={toggleMic}
            whileTap={{ scale: 0.92 }}
            aria-label={listening ? "Stop listening" : "Speak to Paris"}
            aria-pressed={listening}
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{
              background: listening
                ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))"
                : "rgba(255,255,255,0.85)",
              color: listening ? "var(--paper-2)" : "var(--ink)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: listening
                ? "0 6px 18px color-mix(in oklab, var(--accent) 32%, transparent)"
                : "var(--shadow-soft)",
            }}
          >
            <Mic size={16} strokeWidth={2} />
          </motion.button>

          <div
            className="flex flex-1 items-center gap-2 rounded-full"
            style={{
              background: "rgba(255,255,255,0.88)",
              border: "1px solid rgba(255,255,255,0.9)",
              padding: "6px 6px 6px 16px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={expanded ? "Ask Paris anything while we walk…" : "Talk to Paris…"}
              aria-label="Talk to Paris"
              disabled={isThinking}
              className="min-w-0 flex-1 bg-transparent outline-none disabled:opacity-50"
              style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.92 }}
              disabled={!draft.trim() || isThinking}
              aria-label="Send"
              className="grid size-9 shrink-0 place-items-center rounded-full"
              style={{
                background: draft.trim()
                  ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 72%, black))"
                  : "rgba(255,255,255,0.6)",
                color: draft.trim() ? "var(--paper-2)" : "var(--ink-3)",
                opacity: draft.trim() ? 1 : 0.55,
              }}
            >
              <ArrowRight size={16} strokeWidth={2.2} />
            </motion.button>
          </div>
        </form>
      </div>
    </motion.section>
  );
}
