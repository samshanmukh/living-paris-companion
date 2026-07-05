import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wind, Accessibility, Ear, Moon, Utensils, Heart,
  AlertTriangle, Route as RouteIcon, MapPin, Clock, Sparkles, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore, type PersonaKey } from "@/store/useUIStore";
import { useCityStore } from "@/store/useCityStore";
import { belowTopBar, topBarLeft, topBarRight } from "@/lib/layout";

// ── Per-persona demo data (Paris) ──────────────────────────────────────────
type Card = { icon: LucideIcon; title: string; body: string };
type PersonaPack = {
  Icon: LucideIcon;
  accent: string;
  routeLabel: string;
  metrics: { label: string; value: string }[];
  warning?: string;
  cards: Card[];
  nearby: { name: string; note: string }[];
  why: string;
};

function packFor(persona: PersonaKey, destName: string): PersonaPack {
  switch (persona) {
    case "asthma":
      return {
        Icon: Wind,
        accent: "#3aa675",
        routeLabel: "Cleanest-air route",
        metrics: [
          { label: "PM2.5 exposure", value: "−42% vs fastest" },
          { label: "AQI on route", value: "38 (good)" },
          { label: "Extra time", value: "+4 min" },
        ],
        warning: "Air quality moderate near Bd de Sébastopol — route avoids it.",
        cards: [
          { icon: RouteIcon, title: "Avoids high-traffic streets", body: `Skips Rivoli & Sébastopol; routes through pedestrian rue Montorgueil toward ${destName}.` },
          { icon: Sparkles, title: "Green-corridor detour", body: "Cuts through Square Émile-Chautemps — trees drop PM2.5 by ~30% locally." },
        ],
        nearby: [
          { name: "Pharmacie Monge", note: "Inhalers, open until 22:00" },
          { name: "Jardin Anne-Frank", note: "Low-pollution rest stop, 200 m" },
        ],
        why: "This route keeps you on streets with measured PM2.5 under 12 µg/m³ instead of the fastest path (28 µg/m³ near boulevards).",
      };
    case "wheelchair":
      return {
        Icon: Accessibility,
        accent: "#2f7ad9",
        routeLabel: "Step-free route",
        metrics: [
          { label: "Steps on route", value: "0" },
          { label: "Elevators used", value: "3 (all working)" },
          { label: "Slope max", value: "5%" },
        ],
        warning: "Elevator at Châtelet-Les Halles under maintenance — routed via Line 14 (Pyramides).",
        cards: [
          { icon: RouteIcon, title: "Line 14 only", value: "", body: `Fully step-free métro line all the way to the closest lift-equipped exit for ${destName}.` } as Card,
          { icon: MapPin, title: "Curb-cut sidewalks", body: "Avoids cobbled sections of Le Marais; uses asphalt-paved parallel streets." },
        ],
        nearby: [
          { name: "Accessible WC — BHV Marais", note: "Ground floor, key at info desk" },
          { name: "Taxi G7 Access", note: "Ramp-equipped, ~6 min ETA" },
        ],
        why: "Every segment is verified step-free with curb cuts under 2 cm; the fastest route has 14 stairs at the métro exit.",
      };
    case "sensory":
      return {
        Icon: Ear,
        accent: "#8a6bd1",
        routeLabel: "Quiet route",
        metrics: [
          { label: "Avg noise", value: "52 dB" },
          { label: "Crowd score", value: "Low" },
          { label: "Extra time", value: "+6 min" },
        ],
        warning: "Skips Rue de Rivoli (78 dB) and the Marais Saturday market.",
        cards: [
          { icon: RouteIcon, title: "Backstreets only", body: `Uses residential lanes and the Coulée verte to reach ${destName} without boulevards.` },
          { icon: Sparkles, title: "Calm stops", body: "Two shaded courtyards along the way if you need to decompress." },
        ],
        nearby: [
          { name: "Square du Temple", note: "Quiet garden, low foot traffic" },
          { name: "Musée Cognacq-Jay", note: "Silent, rarely crowded, free" },
        ],
        why: "Route stays under 55 dB average — the fastest path peaks at 78 dB with heavy foot traffic.",
      };
    case "safety":
      return {
        Icon: Moon,
        accent: "#d99a2f",
        routeLabel: "Well-lit night route",
        metrics: [
          { label: "Lit streets", value: "98%" },
          { label: "Open venues on route", value: "12" },
          { label: "Safety confidence", value: "High" },
        ],
        warning: "Avoids the park edges and quiet stretches around Château Rouge after 23:00.",
        cards: [
          { icon: RouteIcon, title: "Lit corridor", body: `Stays on illuminated main streets with active businesses all the way to ${destName}.` },
          { icon: MapPin, title: "Populated backup stops", body: "Every 300 m there's an open bar, boulangerie or hotel lobby you can duck into." },
        ],
        nearby: [
          { name: "Hôtel Ibis (24h reception)", note: "Safe waiting point if needed" },
          { name: "Commissariat 10e", note: "Police station, 4 min walk" },
        ],
        why: "Prioritizes streetlight density and open-late venues over shortest distance — no unlit shortcuts.",
      };
    case "halal":
      return {
        Icon: Utensils,
        accent: "#2fa88a",
        routeLabel: "Halal-aware route",
        metrics: [
          { label: "Halal spots near dest.", value: "5" },
          { label: "Nearest mosque", value: "420 m" },
          { label: "Next Maghrib", value: "18:47" },
        ],
        cards: [
          { icon: RouteIcon, title: "Passes prayer-friendly stops", body: `Route to ${destName} goes past a mosque and a prayer room in case Maghrib falls mid-trip.` },
          { icon: Sparkles, title: "Halal confidence", body: "All suggested eateries are AVS-certified or owner-verified halal — no ambiguity." },
        ],
        nearby: [
          { name: "Chez Bebert", note: "Halal couscous, 300 m from destination" },
          { name: "Mosquée Omar", note: "Prayer space, open 05:00–22:00" },
        ],
        why: "Combines your route with halal food density and prayer timing so you don't have to plan Maghrib separately.",
      };
    case "date":
      return {
        Icon: Heart,
        accent: "#d94f7a",
        routeLabel: "Romantic walking route",
        metrics: [
          { label: "Vibe", value: "Terrace + Seine" },
          { label: "Budget est.", value: "€€ (~€65/pp)" },
          { label: "Walk", value: "1.1 km, easy" },
        ],
        cards: [
          { icon: RouteIcon, title: "Golden-hour Seine walk", body: `A slow loop along Quai de l'Hôtel de Ville ending at ${destName} just after sunset.` },
          { icon: Sparkles, title: "Reservation-friendly stops", body: "Two candlelit bistros on the way, both take walk-ins before 20:00." },
        ],
        nearby: [
          { name: "Le Mary Celeste", note: "Natural-wine bar, no reservation needed" },
          { name: "Berthillon", note: "Ice cream on Île Saint-Louis, 6 min detour" },
        ],
        why: "Optimizes for atmosphere over speed: prettier streets, terraces facing west, walkable in heels.",
      };
  }
}

const PERSONA_LABEL: Record<PersonaKey, string> = {
  asthma: "Asthma",
  wheelchair: "Wheelchair",
  sensory: "Sensory-friendly",
  safety: "Night safety",
  halal: "Halal",
  date: "Date night",
};

export function PersonaDestinationPanel() {
  const destination = useUIStore((s) => s.destination);
  const persona = useUIStore((s) => s.activePersona);
  const setDestination = useUIStore((s) => s.setDestination);
  const userLocation = useCityStore((s) => s.userLocation);
  const center = useCityStore((s) => s.center);

  const pack = useMemo(
    () => (persona && destination ? packFor(persona, destination.name) : null),
    [persona, destination],
  );

  // Rough straight-line distance for the header chip
  const distanceKm = useMemo(() => {
    if (!destination) return null;
    const from = userLocation ?? center;
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(destination.lat - from[1]);
    const dLon = toRad(destination.lon - from[0]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(from[1])) * Math.cos(toRad(destination.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }, [destination, userLocation, center]);

  return (
    <AnimatePresence>
      {destination && persona && pack && (
        <motion.aside
          key="pd-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="pointer-events-auto fixed z-40 flex flex-col max-lg:left-auto lg:left-auto"
          style={{
            top: belowTopBar(),
            right: topBarRight(),
            left: "auto",
            width: `min(340px, calc(100vw - ${topBarLeft()}px - ${topBarRight()}px))`,
            maxHeight: "min(72vh, calc(100vh - 140px))",
            borderRadius: 22,
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(255,255,255,0.7)",
            backdropFilter: "blur(24px) saturate(170%)",
            boxShadow: "0 20px 60px rgba(28,26,22,0.22)",
            overflow: "hidden",
          }}
          role="region"
          aria-label={`Personalized suggestions for ${PERSONA_LABEL[persona]}`}
        >
          {/* Header */}
          <div
            className="flex items-start gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.55)" }}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full"
              style={{ background: pack.accent, color: "#fff" }}
            >
              <pack.Icon size={16} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 11, fontWeight: 600, color: pack.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {PERSONA_LABEL[persona]} · {pack.routeLabel}
              </p>
              <p
                className="truncate"
                style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}
                title={destination.name}
              >
                → {destination.name}
              </p>
              {distanceKm !== null && (
                <p style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500, marginTop: 2 }}>
                  <Clock size={10} className="inline mr-1 -mt-0.5" />
                  ~{Math.round(distanceKm * 13)} min · {distanceKm.toFixed(1)} km walk
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDestination(null)}
              aria-label="Close"
              className="grid size-7 shrink-0 place-items-center rounded-full"
              style={{ background: "rgba(255,255,255,0.7)", color: "var(--ink-2)" }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto lp-scroll px-4 py-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2">
              {pack.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl"
                  style={{
                    padding: "8px 9px",
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                >
                  <p style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {m.label}
                  </p>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginTop: 2, lineHeight: 1.2 }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Warning */}
            {pack.warning && (
              <div
                className="flex items-start gap-2 rounded-xl"
                style={{
                  padding: "9px 11px",
                  background: "color-mix(in oklab, #d99a2f 18%, white)",
                  border: "1px solid color-mix(in oklab, #d99a2f 40%, white)",
                }}
              >
                <AlertTriangle size={13} style={{ color: "#a86b12", marginTop: 2 }} />
                <p style={{ fontSize: 12, fontWeight: 500, color: "#7a4d0d", lineHeight: 1.4 }}>
                  {pack.warning}
                </p>
              </div>
            )}

            {/* Route cards */}
            <div className="flex flex-col gap-2">
              {pack.cards.map((c) => (
                <div
                  key={c.title}
                  className="flex items-start gap-2.5 rounded-2xl"
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                >
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full"
                    style={{ background: `color-mix(in oklab, ${pack.accent} 18%, white)`, color: pack.accent }}
                  >
                    <c.icon size={13} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500, lineHeight: 1.4, marginTop: 2 }}>
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nearby useful */}
            <div>
              <p style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                Useful near destination
              </p>
              <ul className="flex flex-col gap-1.5">
                {pack.nearby.map((n) => (
                  <li
                    key={n.name}
                    className="flex items-start gap-2 rounded-xl"
                    style={{
                      padding: "7px 10px",
                      background: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.5)",
                    }}
                  >
                    <MapPin size={11} strokeWidth={2.2} style={{ color: pack.accent, marginTop: 3 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{n.name}</p>
                      <p style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>{n.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Why */}
            <div
              className="rounded-2xl"
              style={{
                padding: "10px 12px",
                background: `color-mix(in oklab, ${pack.accent} 10%, white)`,
                border: `1px solid color-mix(in oklab, ${pack.accent} 30%, white)`,
              }}
            >
              <p style={{ fontSize: 10.5, color: pack.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Why this route
              </p>
              <p style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500, lineHeight: 1.45, marginTop: 4 }}>
                {pack.why}
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
