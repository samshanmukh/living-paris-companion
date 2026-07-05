import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/mapbox";
import {
  birdCountForPreset,
  birdsVisible,
  createBirdOrbits,
  sampleBirdOrbit,
} from "@/lib/parisBirds";
import { resolveLightPreset } from "@/lib/parisWeather";
import { safeProject } from "@/lib/mapSafe";
import { isFirstSession, usePrefsStore } from "@/store/usePrefsStore";
import { useSceneStore } from "@/store/useSceneStore";

interface ScreenBird {
  id: number;
  x: number;
  y: number;
  rot: number;
  flap: number;
}

/** Lightweight sky birds — SVG overlay, no WebGL (safe alongside Mapbox). */
export function MapSkyBirdsOverlay() {
  const { current: mapRef } = useMap();
  const hourOverride = useSceneStore((s) => s.hourOverride);
  const parisConditions = useSceneStore((s) => s.parisConditions);
  const reduced = usePrefsStore((s) => s.reducedMotion);
  const skyLifeEnabled = usePrefsStore((s) => s.skyLifeEnabled);
  const firstSession = isFirstSession();
  const [birds, setBirds] = useState<ScreenBird[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const orbits = useMemo(() => {
    const preset = resolveLightPreset(parisConditions, hourOverride);
    if (reduced || preset === "night" || !skyLifeEnabled) return [];
    return createBirdOrbits(birdCountForPreset(preset, { firstSession }));
  }, [parisConditions, hourOverride, reduced, skyLifeEnabled, firstSession]);

  useEffect(() => {
    if (!mapRef) return;
    setPortalTarget(mapRef.getMap().getContainer());
  }, [mapRef]);

  useEffect(() => {
    if (!mapRef || orbits.length === 0) {
      setBirds([]);
      return;
    }

    const map = mapRef.getMap();
    let frame = 0;
    let cancelled = false;
    const start = performance.now();

    const tick = () => {
      if (cancelled) return;
      const preset = resolveLightPreset(parisConditions, hourOverride);
      if (
        !birdsVisible({ preset, pitch: map.getPitch(), reducedMotion: reduced, skyLifeEnabled }) ||
        !map.isStyleLoaded()
      ) {
        setBirds([]);
        return;
      }

      const t0 = (performance.now() - start) / 1000;
      const next: ScreenBird[] = [];

      orbits.forEach((orbit, id) => {
        const t = (t0 * orbit.speed * 0.35 + orbit.phase / (Math.PI * 2)) % 1;
        const sample = sampleBirdOrbit(orbit, t);
        const p = safeProject(map, [sample.lng, sample.lat]);
        if (!p) return;
        const rect = map.getContainer().getBoundingClientRect();
        if (p.x < -40 || p.y < -40 || p.x > rect.width + 40 || p.y > rect.height * 0.72) return;

        next.push({
          id,
          x: p.x,
          y: p.y,
          rot: (sample.heading * 180) / Math.PI,
          flap: Math.sin(t0 * 6 + orbit.flapPhase) * 4,
        });
      });

      setBirds(next);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        tick();
      });
    };

    tick();
    map.on("render", schedule);
    map.on("move", schedule);
    map.on("resize", schedule);

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      map.off("render", schedule);
      map.off("move", schedule);
      map.off("resize", schedule);
    };
  }, [mapRef, orbits, parisConditions, hourOverride, reduced, skyLifeEnabled]);

  if (!portalTarget || birds.length === 0) return null;

  return createPortal(
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 2 }}
      width="100%"
      height="100%"
    >
      {birds.map((b) => (
        <g key={b.id} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.rot.toFixed(1)})`}>
          <path
            d={`M -10 ${-2 + b.flap} L 0 0 L 10 ${-2 - b.flap}`}
            fill="none"
            stroke="rgba(42, 40, 36, 0.72)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>,
    portalTarget,
  );
}
