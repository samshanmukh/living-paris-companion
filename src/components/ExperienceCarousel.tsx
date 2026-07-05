import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import {
  buildItineraries,
  formatPlanDuration,
  planDayEyebrow,
  stopDescription,
  type Itinerary,
} from "@/lib/itinerary";

function ExperienceCard({
  plan,
  active,
  isRouting,
  onLive,
}: {
  plan: Itinerary;
  active: boolean;
  isRouting: boolean;
  onLive: () => void;
}) {
  return (
    <article
      className="snap-center shrink-0"
      style={{
        width: "min(88vw, 300px)",
        opacity: active ? 1 : 0.72,
        transform: active ? "scale(1)" : "scale(0.97)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      <div
        className="flex h-full flex-col overflow-hidden"
        style={{
          borderRadius: 22,
          background: "rgba(255,255,255,0.88)",
          border: active ? "1px solid rgba(255,255,255,0.95)" : "1px solid rgba(255,255,255,0.7)",
          boxShadow: active
            ? "0 16px 40px rgba(28,26,22,0.16), 0 2px 8px rgba(28,26,22,0.08)"
            : "0 8px 24px rgba(28,26,22,0.1)",
        }}
      >
        <div className="px-4 pt-4 pb-3">
          {plan.tag && (
            <p
              className="mb-1 text-[10px] font-bold uppercase"
              style={{ letterSpacing: "0.14em", color: "#5E8A62" }}
            >
              {plan.tag}
            </p>
          )}
          <p
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.12em", color: "var(--accent-text)" }}
          >
            Your {planDayEyebrow()} · {formatPlanDuration(plan.minutes)}
          </p>
          <h3
            className="font-serif mt-1.5 leading-tight"
            style={{ fontSize: 21, color: "var(--ink)", letterSpacing: "-0.015em" }}
          >
            {plan.title}
          </h3>
        </div>

        <ol className="flex-1 space-y-2 px-4 pb-3">
          {plan.stops.map((stop, i) => (
            <li key={stop.properties.id ?? i} className="flex gap-2.5">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                style={{
                  background: i === 0 ? "var(--ink)" : i === 1 ? "var(--accent)" : "#5E8A62",
                  color: "var(--paper-2)",
                }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 pt-0.5 text-[13px] leading-snug" style={{ color: "var(--ink-2)" }}>
                {stopDescription(stop)}
              </span>
            </li>
          ))}
        </ol>

        <div className="px-4 pb-4 pt-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={isRouting}
            onClick={onLive}
            className="w-full rounded-full py-3 text-center font-semibold"
            style={{
              background: "var(--ink)",
              color: "var(--paper-2)",
              fontSize: 14,
              opacity: isRouting ? 0.7 : 1,
            }}
          >
            {isRouting ? "Opening…" : "Live this one"}
          </motion.button>
        </div>
      </div>
    </article>
  );
}

/** Swipeable experience cards inside chat — map redraws as you browse. */
export function ExperienceCarousel() {
  const geojson = useCityStore((s) => s.geojson);
  const center = useCityStore((s) => s.center);
  const mood = useCityStore((s) => s.mood);
  const rainMode = useCityStore((s) => s.rainMode);
  const route = useCityStore((s) => s.route);
  const isThinking = useCityStore((s) => s.isThinking);
  const isRouting = useCityStore((s) => s.isRouting);
  const routePreviewPlaying = useCityStore((s) => s.routePreviewPlaying);
  const activeExperienceIndex = useCityStore((s) => s.activeExperienceIndex);
  const setActiveExperienceIndex = useCityStore((s) => s.setActiveExperienceIndex);
  const focusExperience = useCityStore((s) => s.focusExperience);
  const planItinerary = useCityStore((s) => s.planItinerary);

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const itineraries = useMemo(
    () =>
      geojson?.features && geojson.features.length >= 2
        ? buildItineraries(geojson.features, center, { mood, rainMode })
        : [],
    [geojson, center, mood, rainMode],
  );

  const show =
    itineraries.length >= 1 && !route && !routePreviewPlaying && !isThinking;

  useEffect(() => {
    if (!show || !itineraries.length) return;
    const safe = Math.min(activeExperienceIndex, itineraries.length - 1);
    if (safe !== activeExperienceIndex) setActiveExperienceIndex(safe);
    focusExperience(safe);
  }, [show, itineraries.length, activeExperienceIndex, setActiveExperienceIndex, focusExperience]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !show) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number((visible.target as HTMLElement).dataset.index);
        if (Number.isFinite(idx) && idx !== activeExperienceIndex) {
          setActiveExperienceIndex(idx);
          focusExperience(idx);
        }
      },
      { root, threshold: 0.55 },
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [show, itineraries.length, activeExperienceIndex, setActiveExperienceIndex, focusExperience]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 -mx-1"
    >
      <p
        className="mb-2.5 text-center text-[12px]"
        style={{ color: "var(--ink-2)", fontWeight: 500 }}
      >
        Paris built{" "}
        <strong style={{ color: "var(--accent-text)", fontWeight: 700 }}>
          {itineraries.length} experience{itineraries.length === 1 ? "" : "s"}
        </strong>{" "}
        from your chat
      </p>

      <div
        ref={scrollRef}
        className="lp-scroll flex gap-3 overflow-x-auto snap-x snap-mandatory px-1 pb-1"
        style={{ scrollPaddingLeft: 12, scrollPaddingRight: 12 }}
      >
        {itineraries.map((plan, i) => (
          <div
            key={plan.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            data-index={i}
          >
            <ExperienceCard
              plan={plan}
              active={i === activeExperienceIndex}
              isRouting={isRouting}
              onLive={() => {
                setActiveExperienceIndex(i);
                void planItinerary(plan.stops);
              }}
            />
          </div>
        ))}
      </div>

      <p
        className="mt-2 text-center text-[10px] uppercase"
        style={{ letterSpacing: "0.12em", color: "var(--ink-3)", fontWeight: 500 }}
      >
        swipe — the route above redraws itself
      </p>
    </motion.div>
  );
}
