import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";

// Web Speech API type shims — not part of standard TS lib.
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean }; length: number };
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
  onFinal?: (text: string) => void;
}

export function VoiceInput({ onFinal }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [level, setLevel] = useState<number[]>(Array(14).fill(0.2));
  const send = useCityStore((s) => s.send);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = () => {
    try { recRef.current?.stop(); } catch {}
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setListening(false);
  };

  const start = async () => {
    const rec = getRecognition();
    if (!rec) {
      alert("Voice input isn't supported in this browser.");
      return;
    }
    setTranscript("");
    setListening(true);

    // Waveform via WebAudio
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
        const bars = Array.from({ length: 14 }, (_, i) => {
          const v = buf[Math.floor((i / 14) * buf.length)] / 255;
          return Math.max(0.15, v);
        });
        setLevel(bars);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // no mic access, still allow recognition (waveform stays low)
    }

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
      setTranscript(combined);
      if (final) {
        stop();
        if (onFinal) onFinal(final.trim());
        else void send(final.trim());
      }
    };
    rec.onerror = () => stop();
    rec.onend = () => stop();
    recRef.current = rec;
    try { rec.start(); } catch { stop(); }
  };

  useEffect(() => () => stop(), []);

  return (
    <>
      <motion.button
        type="button"
        onClick={listening ? stop : start}
        whileTap={{ scale: 0.94 }}
        aria-label={listening ? "Stop voice input" : "Voice input"}
        className="grid size-9 place-items-center rounded-full"
        style={{
          background: listening ? "var(--accent)" : "var(--paper-3)",
          color: listening ? "var(--paper-2)" : "var(--ink-2)",
        }}
      >
        {listening ? <MicOff size={15} strokeWidth={1.8} /> : <Mic size={15} strokeWidth={1.7} />}
      </motion.button>

      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="glass pointer-events-none fixed z-40"
            style={{
              left: "50%",
              bottom: 120,
              transform: "translateX(-50%)",
              padding: "14px 20px",
              borderRadius: 20,
              boxShadow: "var(--shadow-panel)",
              minWidth: 280,
              maxWidth: 460,
            }}
          >
            <div className="flex items-end gap-1 h-8 justify-center mb-2">
              {level.map((v, i) => (
                <motion.span
                  key={i}
                  animate={{ height: `${v * 100}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  style={{
                    width: 3, borderRadius: 2,
                    background: "var(--accent)",
                    display: "inline-block",
                    minHeight: 3,
                  }}
                />
              ))}
            </div>
            <p
              className="text-[13px] text-center"
              style={{ color: "var(--ink)", fontWeight: 500, minHeight: 18 }}
            >
              {transcript || <span style={{ color: "var(--ink-3)" }}>listening…</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
