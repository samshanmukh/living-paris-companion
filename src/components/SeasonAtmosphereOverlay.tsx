import { motion, AnimatePresence } from "framer-motion";
import { useSceneStore } from "@/store/useSceneStore";
import { seasonAtmosphereGradient } from "@/lib/seasonEffects";

/** Visible seasonal color wash over the map — complements fog + snow. */
export function SeasonAtmosphereOverlay() {
  const season = useSceneStore((s) => s.seasonOverride);

  return (
    <AnimatePresence mode="wait">
      {season && (
        <motion.div
          key={season}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: seasonAtmosphereGradient(season),
            mixBlendMode: "soft-light",
          }}
        />
      )}
    </AnimatePresence>
  );
}
