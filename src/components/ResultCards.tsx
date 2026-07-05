import { AnimatePresence, motion } from "framer-motion";
import { Coffee, Footprints, Landmark, MapPin, Star, TreePine } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import type { ParisFeature } from "@/lib/types";

function categoryIcon(layer: string) {
  if (/caf|coffee|food|restaurant/i.test(layer)) return Coffee;
  if (/museum|cultur|art/i.test(layer)) return Landmark;
  if (/park|tree|garden/i.test(layer)) return TreePine;
  return MapPin;
}

function walkMinutes(feature: ParisFeature): number {
  // Deterministic fake walk time when no route is drawn — feels alive.
  const seed = (feature.properties.id ?? feature.properties.name).length;
  return 6 + (seed % 18);
}

function ratingFor(feature: ParisFeature): number {
  const seed = (feature.properties.id ?? feature.properties.name).length;
  return Math.round((4.2 + (seed % 7) * 0.08) * 10) / 10;
}

function reasonFor(feature: ParisFeature): string {
  const p = feature.properties;
  const anyP = p as unknown as { aiSummary?: string; bestFor?: string };
  if (anyP.aiSummary) return anyP.aiSummary;
  if (anyP.bestFor) return anyP.bestFor;
  if (p.quiet) return "A quiet pocket, favored by locals.";
  if (p.familyFriendly) return "Space to wander, easy on little legs.";
  if (p.indoor) return "Warm walls when the weather turns.";
  if (p.tags?.length) return `Known for ${p.tags.slice(0, 2).join(" and ")}.`;
  return "A small pleasure worth the walk.";
}

function ResultCard({ feature, index }: { feature: ParisFeature; index: number }) {
  const select = useCityStore((s) => s.select);
  const selected = useCityStore((s) => s.selected);
  const hover = useCityStore((s) => s.hover);
  const hoveredId = useCityStore((s) => s.hoveredId);
  const route = useCityStore((s) => s.route);
  const isSelected = selected?.properties.id === feature.properties.id;
  const isHover = hoveredId === feature.properties.id;
  const Icon = categoryIcon(feature.properties.layer);
  const walkMin = isSelected && route ? Math.round(route.durationMinutes) : walkMinutes(feature);
  const rating = ratingFor(feature);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => void select(feature)}
      onMouseEnter={() => hover(feature.properties.id)}
      onMouseLeave={() => hover(null)}
      className="glass-strong shrink-0 text-left"
      style={{
        width: 240,
        padding: 14,
        borderRadius: "var(--r-card)",
        boxShadow: isSelected || isHover ? "var(--shadow-panel)" : "var(--shadow-card)",
        border: `1px solid ${isSelected ? "var(--accent-line)" : "var(--line)"}`,
        outline: "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] uppercase"
            style={{ letterSpacing: "0.14em", color: "var(--ink-3)", fontWeight: 500 }}
          >
            {feature.properties.type ?? feature.properties.layer}
          </p>
          <h3
            className="font-serif mt-1 truncate leading-tight"
            style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.01em" }}
          >
            {feature.properties.name}
          </h3>
        </div>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}
        >
          <Icon size={16} strokeWidth={1.6} />
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-2)" }}>
        <Star size={12} strokeWidth={1.8} style={{ color: "var(--accent-text)" }} fill="currentColor" />
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{rating.toFixed(1)}</span>
        <span style={{ color: "var(--ink-3)" }}>·</span>
        <span>{feature.properties.arrondissement ?? "Paris"}</span>
      </div>

      <p
        className="mt-2 line-clamp-2 text-[12.5px]"
        style={{ color: "var(--ink-2)", lineHeight: 1.4 }}
      >
        {reasonFor(feature)}
      </p>

      <span
        className="mt-3 inline-flex items-center gap-1 text-[11px]"
        style={{
          background: "var(--accent-tint)",
          color: "var(--accent-text)",
          borderRadius: "var(--r-pill)",
          padding: "3px 9px",
          fontWeight: 500,
        }}
      >
        <Footprints size={11} strokeWidth={1.8} />
        {walkMin} min walk
      </span>
    </motion.button>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass shrink-0"
      style={{
        width: 240,
        height: 148,
        padding: 14,
        borderRadius: "var(--r-card)",
      }}
    >
      <div style={{ height: 10, width: "40%", background: "var(--paper-3)", borderRadius: 4 }} />
      <div style={{ height: 20, width: "70%", background: "var(--paper-3)", borderRadius: 4, marginTop: 8 }} />
      <div style={{ height: 10, width: "55%", background: "var(--paper-3)", borderRadius: 4, marginTop: 10 }} />
      <div style={{ height: 10, width: "80%", background: "var(--paper-3)", borderRadius: 4, marginTop: 6 }} />
    </motion.div>
  );
}

export function ResultCards() {
  const geojson = useCityStore((s) => s.geojson);
  const isThinking = useCityStore((s) => s.isThinking);
  const features = (geojson?.features ?? []).slice(0, 6);

  if (isThinking && features.length === 0) {
    return (
      <div
        className="lp-scroll pointer-events-auto absolute z-10 flex gap-3 overflow-x-auto pb-2
          left-3 right-3 sm:left-[400px] sm:right-[80px]"
        style={{ bottom: 24 }}
      >
        {[0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)}
      </div>
    );
  }

  if (features.length === 0) return null;

  return (
    <div
      className="lp-scroll pointer-events-auto absolute z-10 flex gap-3 overflow-x-auto pb-2
        left-3 right-3 sm:left-[400px] sm:right-[80px]"
      style={{ bottom: 24 }}
    >
      <AnimatePresence>
        {features.map((f, i) => (
          <ResultCard key={f.properties.id ?? i} feature={f} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
