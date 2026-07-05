import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { markerLabel } from "@/lib/markerLabels";
import { rainDim, isRainFriendly } from "@/lib/rainMode";
import type { ParisFeature } from "@/lib/types";

interface Props {
  feature: ParisFeature;
  index: number;
  selected: boolean;
  onClick: () => void;
}

export function ParisMarker({ feature, index, selected, onClick }: Props) {
  const hoveredId = useCityStore((s) => s.hoveredId);
  const hover = useCityStore((s) => s.hover);
  const rainMode = useCityStore((s) => s.rainMode);
  const mood = useCityStore((s) => s.mood);
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const activeRouteStop = useCityStore((s) => s.activeRouteStop);
  const highlightedIds = useCityStore((s) => s.highlightedIds);
  const isHighlighted = highlightedIds.includes(feature.properties.id);
  const isHover = hoveredId === feature.properties.id;
  const active = selected || isHover || isHighlighted;
  const dim = rainMode ? rainDim(feature) : 1;
  const stopIndex = routeWaypoints?.findIndex((w) => w.id === feature.properties.id) ?? -1;
  const onRoute = stopIndex > 0;
  const isActiveStop = stopIndex === activeRouteStop && stopIndex > 0;
  const { title, subtitle } = markerLabel(feature, mood, index);
  const showLabel = dim > 0.45;

  const dotColors = ["#C77E6A", "#7E9B6E", "#7C93A6", "#C79A4E"];
  const dotColor = dotColors[index % dotColors.length];

  return (
    <div className="relative -translate-x-1/2 -translate-y-1/2" style={{ pointerEvents: "auto" }}>
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: dim, x: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: index * 0.06 + 0.12 }}
          className="glass-strong pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap"
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--ink)",
            boxShadow: "0 4px 16px rgba(28,26,22,0.14)",
            maxWidth: 148,
          }}
        >
          <span className="block truncate">{title}</span>
          {subtitle && subtitle !== title && (
            <span className="block truncate" style={{ fontSize: 10, fontWeight: 500, color: "var(--ink-3)" }}>
              {subtitle}
            </span>
          )}
        </motion.div>
      )}

      <motion.button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={() => hover(feature.properties.id)}
        onMouseLeave={() => hover(null)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: dim }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.05 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.94 }}
        className="relative cursor-pointer"
        aria-label={feature.properties.name}
        style={{ background: "transparent", border: 0, padding: 0 }}
      >
        {onRoute && (
          <span
            className="absolute -top-1 -right-1 z-10 grid place-items-center rounded-full font-bold"
            style={{
              width: isActiveStop ? 18 : 16,
              height: isActiveStop ? 18 : 16,
              fontSize: isActiveStop ? 10 : 9,
              background: isActiveStop ? "var(--accent)" : "var(--ink)",
              color: "var(--paper-2)",
              boxShadow: isActiveStop ? "0 0 0 3px rgba(199,126,106,0.45)" : undefined,
            }}
          >
            {stopIndex}
          </span>
        )}
        {(active || isActiveStop || isHighlighted) && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: isHighlighted ? 28 : 24,
              height: isHighlighted ? 28 : 24,
              marginLeft: isHighlighted ? -14 : -12,
              marginTop: isHighlighted ? -14 : -12,
              border: isHighlighted ? "2.5px solid var(--accent)" : "2px solid var(--accent)",
              opacity: isHighlighted ? 0.75 : 0.5,
              animation: "lp-pulse-ring 1.8s var(--ease-out) infinite",
            }}
          />
        )}
        <span
          className="block rounded-full"
          style={{
            width: active ? 16 : 13,
            height: active ? 16 : 13,
            background: dotColor,
            border: "2.5px solid var(--paper-2)",
            boxShadow: active
              ? `0 6px 18px rgba(28,26,22,0.28), 0 0 0 1px ${dotColor}55`
              : "0 3px 10px rgba(28,26,22,0.22)",
          }}
        />
      </motion.button>

      {rainMode && isRainFriendly(feature) && (
        <span
          className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
          style={{ background: "rgba(124,147,166,0.9)", color: "#fff" }}
        >
          Covered
        </span>
      )}
    </div>
  );
}
