import type { LightPreset } from "@/lib/parisWeather";

const PARIS_CENTER = { lng: 2.3498, lat: 48.8572 };

export interface BirdOrbit {
  centerLng: number;
  centerLat: number;
  radiusLng: number;
  radiusLat: number;
  baseAlt: number;
  altWave: number;
  speed: number;
  phase: number;
  flapPhase: number;
}

export function birdCountForPreset(preset: LightPreset, opts?: { firstSession?: boolean }): number {
  if (preset === "night") return 0;
  const base = preset === "dawn" || preset === "dusk" ? 5 : 4;
  return opts?.firstSession ? base + 2 : base;
}

export function birdsVisible(opts: {
  preset: LightPreset;
  pitch: number;
  reducedMotion: boolean;
  skyLifeEnabled?: boolean;
}): boolean {
  if (opts.skyLifeEnabled === false) return false;
  if (opts.reducedMotion) return false;
  if (opts.preset === "night") return false;
  return opts.pitch >= 32;
}

/** Seeded orbits around central Paris — stable paths, varied height and speed. */
export function createBirdOrbits(count: number): BirdOrbit[] {
  if (count <= 0) return [];

  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1;
    const angle = (seed * 1.618) % (Math.PI * 2);
    const dist = 0.004 + (seed % 3) * 0.0025;
    return {
      centerLng: PARIS_CENTER.lng + Math.cos(angle) * 0.008,
      centerLat: PARIS_CENTER.lat + Math.sin(angle) * 0.006,
      radiusLng: dist,
      radiusLat: dist * 0.72,
      baseAlt: 95 + (seed % 4) * 28,
      altWave: 8 + (seed % 3) * 5,
      speed: 0.018 + (seed % 3) * 0.008,
      phase: seed * 0.91,
      flapPhase: seed * 2.17,
    };
  });
}

export function sampleBirdOrbit(
  orbit: BirdOrbit,
  t: number,
): { lng: number; lat: number; alt: number; heading: number } {
  const angle = t * Math.PI * 2;
  const lng = orbit.centerLng + Math.cos(angle + orbit.phase) * orbit.radiusLng;
  const lat = orbit.centerLat + Math.sin(angle + orbit.phase) * orbit.radiusLat;
  const alt = orbit.baseAlt + Math.sin(angle * 1.7 + orbit.phase) * orbit.altWave;
  const heading = angle + orbit.phase + Math.PI / 2;
  return { lng, lat, alt, heading };
}

export function birdSilhouetteColor(preset: LightPreset): number {
  if (preset === "dawn" || preset === "dusk") return 0x3d3028;
  return 0x2a2824;
}
