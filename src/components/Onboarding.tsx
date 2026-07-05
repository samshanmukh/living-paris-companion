import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, MousePointerClick, Footprints, X } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";

const KEY = "lp.onboarded.v1";

const STEPS = [
  {
    icon: Sparkles,
    title: "Set a mood",
    body: "Tap a mood chip in the chat — Date night, Rainy day, Photo walk — and Paris re-themes around it.",
  },
  {
    icon: MousePointerClick,
    title: "Pick a place",
    body: "Scroll the postcard cards and choose one. The map flies to it and pins the spot.",
  },
  {
    icon: Footprints,
    title: "Walk there",
    body: "Tap Live this one. A route unfolds and the map walks you through each stop.",
    visual: "route" as const,
  },
];

/** Quick tour — opens after the first successful AI reply, not on raw first paint. */
export function Onboarding() {
  const messages = useCityStore((s) => s.messages);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const hasAiReply = messages.some((m) => m.role === "ai");

  useEffect(() => {
    if (!hasAiReply) return;
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [hasAiReply]);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lp-onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-50 flex flex-col"
          style={{
            background: "color-mix(in oklab, var(--ink) 22%, transparent)",
            backdropFilter: "blur(6px)",
          }}
          onClick={dismiss}
        >
          <div className="flex-1" />

          <motion.div
            key={step}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="glass lp-onboard-card relative mx-auto w-full"
            style={{
              maxWidth: 440,
              padding: 24,
              boxShadow: "var(--shadow-panel)",
            }}
          >
            <button
              onClick={dismiss}
              aria-label="Skip tour"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full"
              style={{ color: "var(--ink-3)" }}
            >
              <X size={16} />
            </button>

            <p
              className="text-[10px] font-medium uppercase"
              style={{ letterSpacing: "0.16em", color: "var(--ink-3)" }}
            >
              A quick tour · {step + 1} of {STEPS.length}
            </p>

            <StepBody step={step} />

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="block h-1 rounded-full transition-all"
                    style={{
                      width: i === step ? 20 : 6,
                      background: i === step ? "var(--accent)" : "var(--line-strong)",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={dismiss}
                  className="rounded-full px-3 py-2 text-[13px]"
                  style={{ color: "var(--ink-3)" }}
                >
                  Skip
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={next}
                  className="text-[13px] font-medium"
                  style={{
                    background: "var(--accent)",
                    color: "var(--paper)",
                    borderRadius: "var(--r-pill)",
                    padding: "10px 18px",
                    boxShadow: "0 6px 18px -8px var(--accent)",
                  }}
                >
                  {step < STEPS.length - 1 ? "Next" : "Explore Paris"}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <div className="lp-onboard-bottom-spacer" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepBody({ step }: { step: number }) {
  const s = STEPS[step];
  const Icon = s.icon;
  return (
    <div className="mt-3">
      <div
        className="mb-4 grid size-11 place-items-center"
        style={{
          background: "var(--accent-tint)",
          color: "var(--accent-text)",
          border: "1px solid var(--line)",
          borderRadius: 14,
        }}
      >
        <Icon size={20} />
      </div>
      <h2
        className="font-display"
        style={{ fontSize: 26, lineHeight: 1.1, color: "var(--ink)", letterSpacing: "-0.01em" }}
      >
        {s.title}
      </h2>
      <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>
        {s.body}
      </p>
      {"visual" in s && s.visual === "route" && <RouteDemo />}
    </div>
  );
}

const PATH_D = "M 24 96 C 90 20, 170 150, 236 40 S 340 130, 396 60";
const PATH_LEN = 460;

function RouteDemo() {
  return (
    <div
      className="relative mt-4 overflow-hidden"
      style={{
        height: 130,
        borderRadius: 16,
        background:
          "radial-gradient(120% 100% at 0% 100%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%), var(--paper-2)",
        border: "1px solid var(--line)",
      }}
    >
      <svg viewBox="0 0 420 130" width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
        <defs>
          <radialGradient id="lp-spot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={PATH_D} fill="none" stroke="var(--accent)" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />
        <path
          d={PATH_D}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${PATH_LEN} ${PATH_LEN}`}
          strokeDashoffset={PATH_LEN}
        >
          <animate attributeName="stroke-dashoffset" from={PATH_LEN} to={0} dur="2.6s" repeatCount="indefinite" />
        </path>
        <circle cx="24" cy="96" r="5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="396" cy="60" r="6" fill="var(--accent)" />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 text-[11px] font-medium"
        style={{
          background: "var(--glass-strong)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-pill)",
          padding: "5px 10px",
          backdropFilter: "var(--blur)",
        }}
      >
        <Footprints size={11} style={{ color: "var(--accent)" }} />
        8 min walk · ~650 m
      </motion.div>
    </div>
  );
}
