import { useEffect, useRef, useState } from "react";
import { useCityStore } from "@/store/useCityStore";

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

export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const send = useCityStore((s) => s.send);
  const setLiveTranscript = useCityStore((s) => s.setLiveTranscript);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  };

  const start = () => {
    const rec = getRecognition();
    if (!rec) {
      alert("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    setTranscript("");
    setListening(true);
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
      setLiveTranscript(combined);
      if (final) {
        stop();
        setTranscript("");
        setLiveTranscript("");
        void send(final.trim());
      }
    };
    rec.onerror = () => stop();
    rec.onend = () => stop();
    recRef.current = rec;
    try { rec.start(); } catch { stop(); }
  };

  const toggle = () => (listening ? stop() : start());

  useEffect(() => () => stop(), []);

  return { listening, transcript, start, stop, toggle };
}
