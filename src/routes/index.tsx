import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import { useEffect } from "react";
import { MapCanvas } from "@/components/MapCanvas";
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
        <MapCanvas />

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
