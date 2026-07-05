import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    [i: number]: { [j: number]: { transcript: string }; isFinal: boolean };
    length: number;
  };
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-US";
  r.interimResults = true;
  r.continuous = false;
  return r;
}

interface Props {
  size?: number;
  onStart?: () => void;
}

/** Inline mic button with live waveform. Sends final transcript to the store. */
export function MicButton({ size = 44, onStart }: Props) {
  const [listening, setListening] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(14).fill(0.15));
  const send = useCityStore((s) => s.send);
  const setLiveTranscript = useCityStore((s) => s.setLiveTranscript);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopAll = () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setListening(false);
    setBars(Array(14).fill(0.15));
  };

  const start = async () => {
    const rec = getRecognition();
    if (!rec) {
      alert("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    setListening(true);
    onStart?.();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        const next = Array.from({ length: 14 }, (_, i) => {
          const v = buf[Math.floor((i / 14) * buf.length)] / 255;
          return Math.max(0.15, Math.min(1, v * 1.4));
        });
        setBars(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* mic denied — recognition still runs */ }

    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) final += txt;
        else interim += txt;
      }
      const combined = (final + interim).trim();
      setLiveTranscript(combined);
      if (final) {
        stopAll();
        void send(final.trim());
      }
    };
    rec.onerror = () => stopAll();
    rec.onend = () => stopAll();
    recRef.current = rec;
    try { rec.start(); } catch { stopAll(); }
  };

  useEffect(() => () => stopAll(), []);

  return (
    <motion.button
      type="button"
      onClick={listening ? stopAll : start}
      aria-label={listening ? "Stop listening" : "Speak"}
      whileTap={{ scale: 0.94 }}
      animate={
        listening
          ? {
              boxShadow: [
                "0 6px 20px rgba(199,126,106,0.28), 0 0 0 0 rgba(199,126,106,0.45)",
                "0 6px 20px rgba(199,126,106,0.28), 0 0 0 12px rgba(199,126,106,0.0)",
                "0 6px 20px rgba(199,126,106,0.28), 0 0 0 0 rgba(199,126,106,0.45)",
              ],
            }
          : {}
      }
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className="relative grid shrink-0 place-items-center rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        color: listening ? "var(--paper-2)" : "var(--ink)",
        background: listening
          ? "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, black))"
          : "var(--paper-2)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 4px 14px rgba(28,26,22,0.16)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!listening ? (
          <motion.span
            key="mic"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Mic size={Math.round(size * 0.42)} strokeWidth={1.7} />
          </motion.span>
        ) : (
          <motion.div
            key="wave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-end gap-[2px]"
            style={{ height: size * 0.45 }}
          >
            {bars.map((v, i) => (
              <motion.span
                key={i}
                animate={{ height: `${Math.round(v * 100)}%` }}
                transition={{ type: "spring", stiffness: 340, damping: 20 }}
                style={{
                  width: 2,
                  minHeight: 2,
                  borderRadius: 1,
                  background: "var(--paper-2)",
                  display: "inline-block",
                  opacity: 0.6 + v * 0.4,
                }}
              />
            ))}
            <span className="sr-only"><Square size={0} /></span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
