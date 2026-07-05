import { useEffect } from "react";
import { usePrefsStore } from "@/store/usePrefsStore";
import { startAmbientSound, stopAmbientSound } from "@/lib/ambientSound";

/** Mount once on the main route — starts/stops ambient soundscape from prefs. */
export function AmbientSoundController() {
  const enabled = usePrefsStore((s) => s.ambientSoundEnabled);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);

  useEffect(() => {
    if (enabled && !reducedMotion) {
      void startAmbientSound();
      return () => stopAmbientSound();
    }
    stopAmbientSound();
  }, [enabled, reducedMotion]);

  return null;
}
