import type { CSSProperties } from "react";
import type { MoodType } from "./types";
import type { LightPreset } from "./parisWeather";

export interface MoodMapProfile {
  /** Basemap light preset when no hour override is active. */
  lightPreset: LightPreset;
  theme: "default" | "faded";
  pitch: number;
  bearing: number;
  zoomOffset: number;
  /** Edge vignette over the map canvas (0–1). */
  veilOpacity: number;
  veilColor: string;
  fog: {
    color: string;
    highColor: string;
    horizonBlend: number;
    spaceColor: string;
    starIntensity: number;
  };
  /** Subtle UI chrome shift on mood change. */
  uiTint: string;
}

export const MOOD_MAP: Record<MoodType, MoodMapProfile> = {
  romantic: {
    lightPreset: "dusk",
    theme: "faded",
    pitch: 66,
    bearing: -14,
    zoomOffset: 0.15,
    veilOpacity: 0.42,
    veilColor: "rgba(80, 42, 32, 0.55)",
    fog: {
      color: "rgb(72, 48, 44)",
      highColor: "rgb(140, 90, 78)",
      horizonBlend: 0.16,
      spaceColor: "rgb(48, 32, 36)",
      starIntensity: 0.06,
    },
    uiTint: "rgba(199, 126, 106, 0.06)",
  },
  family: {
    lightPreset: "day",
    theme: "default",
    pitch: 58,
    bearing: -6,
    zoomOffset: 0,
    veilOpacity: 0.32,
    veilColor: "rgba(40, 52, 36, 0.45)",
    fog: {
      color: "rgb(236, 232, 220)",
      highColor: "rgb(210, 218, 200)",
      horizonBlend: 0.08,
      spaceColor: "rgb(220, 224, 216)",
      starIntensity: 0,
    },
    uiTint: "rgba(126, 155, 110, 0.05)",
  },
  rainy: {
    lightPreset: "dusk",
    theme: "faded",
    pitch: 52,
    bearing: -4,
    zoomOffset: 0,
    veilOpacity: 0.48,
    veilColor: "rgba(36, 48, 62, 0.62)",
    fog: {
      color: "rgb(48, 56, 68)",
      highColor: "rgb(90, 102, 118)",
      horizonBlend: 0.18,
      spaceColor: "rgb(36, 42, 52)",
      starIntensity: 0,
    },
    uiTint: "rgba(124, 147, 166, 0.07)",
  },
  photography: {
    lightPreset: "dawn",
    theme: "faded",
    pitch: 70,
    bearing: -18,
    zoomOffset: 0.25,
    veilOpacity: 0.38,
    veilColor: "rgba(72, 52, 28, 0.5)",
    fog: {
      color: "rgb(88, 68, 48)",
      highColor: "rgb(180, 130, 72)",
      horizonBlend: 0.14,
      spaceColor: "rgb(72, 56, 40)",
      starIntensity: 0,
    },
    uiTint: "rgba(199, 154, 78, 0.06)",
  },
  culture: {
    lightPreset: "day",
    theme: "faded",
    pitch: 62,
    bearing: -10,
    zoomOffset: 0.1,
    veilOpacity: 0.36,
    veilColor: "rgba(52, 42, 32, 0.52)",
    fog: {
      color: "rgb(228, 220, 208)",
      highColor: "rgb(200, 188, 168)",
      horizonBlend: 0.1,
      spaceColor: "rgb(212, 204, 192)",
      starIntensity: 0,
    },
    uiTint: "rgba(139, 115, 85, 0.05)",
  },
  food: {
    lightPreset: "day",
    theme: "default",
    pitch: 64,
    bearing: -12,
    zoomOffset: 0.2,
    veilOpacity: 0.4,
    veilColor: "rgba(68, 40, 28, 0.52)",
    fog: {
      color: "rgb(240, 232, 220)",
      highColor: "rgb(220, 200, 180)",
      horizonBlend: 0.09,
      spaceColor: "rgb(228, 220, 210)",
      starIntensity: 0,
    },
    uiTint: "rgba(199, 126, 106, 0.06)",
  },
  relaxing: {
    lightPreset: "day",
    theme: "faded",
    pitch: 54,
    bearing: -8,
    zoomOffset: 0,
    veilOpacity: 0.34,
    veilColor: "rgba(36, 56, 52, 0.48)",
    fog: {
      color: "rgb(232, 238, 234)",
      highColor: "rgb(200, 216, 210)",
      horizonBlend: 0.1,
      spaceColor: "rgb(220, 228, 224)",
      starIntensity: 0,
    },
    uiTint: "rgba(110, 155, 149, 0.05)",
  },
  nightlife: {
    lightPreset: "night",
    theme: "faded",
    pitch: 60,
    bearing: -22,
    zoomOffset: 0.1,
    veilOpacity: 0.52,
    veilColor: "rgba(16, 14, 28, 0.72)",
    fog: {
      color: "rgb(14, 16, 28)",
      highColor: "rgb(32, 28, 48)",
      horizonBlend: 0.14,
      spaceColor: "rgb(8, 10, 20)",
      starIntensity: 0.42,
    },
    uiTint: "rgba(139, 115, 85, 0.08)",
  },
  hidden: {
    lightPreset: "dusk",
    theme: "faded",
    pitch: 63,
    bearing: -16,
    zoomOffset: 0.15,
    veilOpacity: 0.44,
    veilColor: "rgba(32, 48, 36, 0.55)",
    fog: {
      color: "rgb(56, 64, 56)",
      highColor: "rgb(100, 112, 96)",
      horizonBlend: 0.12,
      spaceColor: "rgb(40, 48, 42)",
      starIntensity: 0.04,
    },
    uiTint: "rgba(126, 155, 110, 0.05)",
  },
  general: {
    lightPreset: "day",
    theme: "faded",
    pitch: 65,
    bearing: -10,
    zoomOffset: 0.1,
    veilOpacity: 0.36,
    veilColor: "rgba(40, 36, 28, 0.5)",
    fog: {
      color: "rgb(244, 240, 232)",
      highColor: "rgb(220, 220, 224)",
      horizonBlend: 0.08,
      spaceColor: "rgb(220, 220, 224)",
      starIntensity: 0,
    },
    uiTint: "rgba(199, 126, 106, 0.04)",
  },
};

export function moodMapProfile(mood: MoodType): MoodMapProfile {
  return MOOD_MAP[mood] ?? MOOD_MAP.general;
}

export function moodMapStyleVars(mood: MoodType): CSSProperties {
  const p = moodMapProfile(mood);
  return {
    ["--map-veil" as string]: p.veilColor,
    ["--map-veil-opacity" as string]: String(p.veilOpacity),
    ["--mood-ui-tint" as string]: p.uiTint,
  };
}
