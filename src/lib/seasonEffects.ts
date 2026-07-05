import type { Season } from "@/store/useSceneStore";

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring blossom haze",
  summer: "Summer golden light",
  autumn: "Autumn amber glow",
  winter: "Winter snow on the map",
};

type FogSpec = {
  color: string;
  "high-color": string;
  "horizon-blend": number;
  "space-color": string;
  "star-intensity": number;
};

/** Stronger fog tints — previous values were nearly invisible on Standard style. */
export function seasonFog(season: Season | null, base: FogSpec): FogSpec {
  if (!season) return base;
  switch (season) {
    case "spring":
      return {
        ...base,
        color: "rgb(228, 244, 224)",
        "high-color": "rgb(180, 220, 170)",
        "horizon-blend": Math.min(0.22, base["horizon-blend"] + 0.06),
      };
    case "summer":
      return {
        ...base,
        color: "rgb(255, 244, 210)",
        "high-color": "rgb(245, 210, 140)",
        "horizon-blend": Math.min(0.24, base["horizon-blend"] + 0.08),
      };
    case "autumn":
      return {
        ...base,
        color: "rgb(255, 232, 200)",
        "high-color": "rgb(220, 160, 90)",
        "horizon-blend": Math.min(0.26, base["horizon-blend"] + 0.1),
      };
    case "winter":
      return {
        ...base,
        color: "rgb(220, 232, 248)",
        "high-color": "rgb(180, 200, 230)",
        "horizon-blend": Math.min(0.2, base["horizon-blend"] + 0.05),
        "star-intensity": Math.max(base["star-intensity"], 0.15),
      };
    default:
      return base;
  }
}

export function seasonAtmosphereGradient(season: Season): string {
  switch (season) {
    case "spring":
      return `
        radial-gradient(120% 80% at 20% 10%, rgba(255, 170, 200, 0.22) 0%, transparent 55%),
        radial-gradient(90% 70% at 80% 30%, rgba(180, 230, 170, 0.16) 0%, transparent 50%),
        linear-gradient(to bottom, rgba(255, 240, 245, 0.08) 0%, transparent 40%)
      `;
    case "summer":
      return `
        radial-gradient(110% 70% at 50% 0%, rgba(255, 210, 90, 0.24) 0%, transparent 58%),
        linear-gradient(to bottom, rgba(255, 248, 220, 0.1) 0%, transparent 45%)
      `;
    case "autumn":
      return `
        radial-gradient(100% 75% at 30% 15%, rgba(230, 140, 60, 0.26) 0%, transparent 55%),
        radial-gradient(80% 60% at 70% 25%, rgba(180, 90, 40, 0.14) 0%, transparent 50%),
        linear-gradient(to bottom, rgba(255, 220, 180, 0.1) 0%, transparent 42%)
      `;
    case "winter":
      return `
        radial-gradient(120% 90% at 50% 20%, rgba(210, 230, 255, 0.2) 0%, transparent 60%),
        linear-gradient(to bottom, rgba(240, 248, 255, 0.12) 0%, transparent 50%)
      `;
  }
}
