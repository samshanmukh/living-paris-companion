import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { PlaceDetail } from "@/components/PlaceDetail";
import { LivingParisBadge } from "@/components/LivingParisBadge";
import { PipelineViz } from "@/components/PipelineViz";
import { ConversationalPanel } from "@/components/ConversationalPanel";
import { WhatChangedChips } from "@/components/WhatChangedChips";
import { RouteBar } from "@/components/RouteBar";
import { RoutePreviewCard } from "@/components/RoutePreviewCard";
import { ArrivalOverlay } from "@/components/ArrivalOverlay";
import { PersonaSidebar } from "@/components/PersonaSidebar";
import { Onboarding } from "@/components/Onboarding";
import { DemoOverlay } from "@/components/DemoOverlay";
import { AmbientSoundController } from "@/components/AmbientSoundController";
import { moodStyleVars } from "@/lib/moods";
import { useCityStore } from "@/store/useCityStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { useTraitsStore } from "@/store/useTraitsStore";

const MapCanvas = lazy(() =>
  import("@/components/MapCanvas").then((m) => ({ default: m.MapCanvas })),
);

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

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

function DebugControlsGate() {
  const showDebug = usePrefsStore((s) => s.showDebugControls);
  if (!showDebug && !DEMO_MODE) return null;
  return <DemoOverlay />;
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const mood = useCityStore((s) => s.mood);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const initTraits = useTraitsStore((s) => s.init);
  const recordVisit = usePrefsStore((s) => s.recordVisit);

  useEffect(() => {
    void initTraits();
    recordVisit();
  }, [initTraits, recordVisit]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <motion.main
        initial={reducedMotion ? false : { opacity: 0.97 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-screen w-screen overflow-hidden"
        style={{
          background: "var(--paper)",
          ...moodStyleVars(mood),
          boxShadow: `inset 0 0 120px var(--mood-ui-tint, transparent)`,
        }}
      >
        <MapCanvasGate />
        <ArrivalOverlay />

        <PersonaSidebar />
        <LivingParisBadge />
        <WhatChangedChips />
        <RoutePreviewCard />
        <PipelineViz />
        <DebugControlsGate />

        <RouteBar />
        <ConversationalPanel />
        <Onboarding />
        <AmbientSoundController />

        <PlaceDetail />
      </motion.main>
    </MotionConfig>
  );
}
