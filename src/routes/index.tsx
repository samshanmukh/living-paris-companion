import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { PlaceDetail } from "@/components/PlaceDetail";
import { LivingParisBadge } from "@/components/LivingParisBadge";
import { PipelineViz } from "@/components/PipelineViz";
import { ConversationalPanel } from "@/components/ConversationalPanel";
import { RouteBar } from "@/components/RouteBar";
import { RoutePreviewCard } from "@/components/RoutePreviewCard";
import { moodStyleVars } from "@/lib/moods";
import { useCityStore } from "@/store/useCityStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useTraitsStore } from "@/store/useTraitsStore";

const MapCanvas = lazy(() =>
  import("@/components/MapCanvas").then((m) => ({ default: m.MapCanvas })),
);

function MapCanvasGate() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="absolute inset-0" style={{ background: "var(--paper-2, var(--paper))" }} />
    );
  }
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0" style={{ background: "var(--paper-2, var(--paper))" }} />
      }
    >
      <MapCanvas />
    </Suspense>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const mood = useCityStore((s) => s.mood);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const initTraits = useTraitsStore((s) => s.init);

  useEffect(() => {
    void initTraits();
  }, [initTraits]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <motion.main
        key={mood}
        initial={reducedMotion ? false : { opacity: 0.94, filter: "brightness(0.98)" }}
        animate={{ opacity: 1, filter: "brightness(1)" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-screen w-screen overflow-hidden"
        style={{
          background: "var(--paper)",
          ...moodStyleVars(mood),
          boxShadow: `inset 0 0 120px var(--mood-ui-tint, transparent)`,
        }}
      >
        <MapCanvasGate />

        <LivingParisBadge />
        <RoutePreviewCard />
        <PipelineViz />

        {/* Voice-first conversational sheet — suggestions + talk back */}
        <RouteBar />
        <ConversationalPanel />

        {/* Tap a marker for detail + start route */}
        <PlaceDetail />
      </motion.main>
    </MotionConfig>
  );
}
