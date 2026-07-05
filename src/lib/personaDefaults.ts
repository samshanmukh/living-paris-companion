import type { PersonaKey } from "@/store/useUIStore";
import { useCityStore } from "@/store/useCityStore";
import { useSceneStore } from "@/store/useSceneStore";

/** Apply map + scene defaults when a persona is selected. */
export function applyPersonaDefaults(key: PersonaKey) {
  const scene = useSceneStore.getState();
  const city = useCityStore.getState();

  switch (key) {
    case "asthma":
      scene.setAirQualityVisible(true);
      city.setMoodFromAction("relaxing");
      break;
    case "wheelchair":
      city.setMoodFromAction("family");
      break;
    case "sensory":
      city.setMoodFromAction("relaxing");
      break;
    case "safety":
      scene.setHour(23);
      city.setMoodFromAction("nightlife");
      break;
    case "halal":
      city.setMoodFromAction("food");
      break;
    case "date":
      city.setMoodFromAction("romantic");
      break;
  }
}

/** Brighter fog when night-safety persona is active (easier to read streets). */
export function personaFogBoost(key: PersonaKey | null): number {
  return key === "safety" ? 0.08 : 0;
}
