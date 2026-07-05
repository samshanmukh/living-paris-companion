import { motion } from "framer-motion";
import { useCityStore } from "@/store/useCityStore";
import { markerLabel } from "@/lib/markerLabels";
import { rainDim, isRainFriendly } from "@/lib/rainMode";
import type { ParisFeature } from "@/lib/types";

interface Props {
  feature: ParisFeature;
  index: number;
  planStopNumber?: number;
  selected: boolean;
  onClick: () => void;
}

export function ParisMarker({ feature, index, planStopNumber, selected, onClick }: Props) {
  const hoveredId = useCityStore((s) => s.hoveredId);
  const hover = useCityStore((s) => s.hover);
  const rainMode = useCityStore((s) => s.rainMode);
  const mood = useCityStore((s) => s.mood);
  const geojson = useCityStore((s) => s.geojson);
  const routeWaypoints = useCityStore((s) => s.routeWaypoints);
  const activeRouteStop = useCityStore((s) => s.activeRouteStop);
  const highlightedIds = useCityStore((s) => s.highlightedIds);
  const isHighlighted = highlightedIds.includes(feature.properties.id);
  const isHover = hoveredId === feature.properties.id;
  const active = selected || isHover || isHighlighted;
  const dim = rainMode ? rainDim(feature) : 1;
  const stopIndex = routeWaypoints?.findIndex((w) => w.id === feature.properties.id) ?? -1;
  const onRoute = stopIndex >= 0;
  const isActiveStop = stopIndex === activeRouteStop && stopIndex >= 0;
  const showRouteBadge = onRoute;
  const showPlanBadge = !showRouteBadge && planStopNumber != null;
  const placeCount = geojson?.features.length ?? 0;
  const { title, subtitle } = markerLabel(feature, mood, index);
  const showLabel = dim > 0.4 && (placeCount <= 5 || active || onRoute);
  const labelEmphasis = active || isActiveStop || isHighlighted;

  const dotColors = ["#C77E6A", "#7E9B6E", "#7C93A6", "#C79A4E"];
  const dotColor = dotColors[index % dotColors.length];

  return (
    <div className="relative -translate-x-1/2 -translate-y-1/2" style={{ pointerEvents: "auto" }}>
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: labelEmphasis ? 1 : dim * 0.92, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: index * 0.05 + 0.08 }}
          className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 max-w-[168px] -translate-x-1/2 whitespace-nowrap"
          style={{
            padding: labelEmphasis ? "7px 12px" : "5px 10px",
            borderRadius: 999,
            fontSize: labelEmphasis ? 12.5 : 11.5,
            fontWeight: 600,
            color: "var(--ink)",
            background: "rgba(253, 251, 246, 0.96)",
            backdropFilter: "blur(12px) saturate(1.2)",
            WebkitBackdropFilter: "blur(12px) saturate(1.2)",
            border: labelEmphasis
              ? "1px solid rgba(255,255,255,0.92)"
              : "1px solid rgba(255,255,255,0.75)",
            boxShadow: labelEmphasis
              ? "0 8px 28px rgba(28,26,22,0.22), 0 2px 8px rgba(28,26,22,0.12)"
              : "0 4px 18px rgba(28,26,22,0.16)",
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
        {showPlanBadge && (
          <span
            className="absolute -top-1 -right-1 z-10 grid place-items-center rounded-full font-bold"
            style={{
              width: 18,
              height: 18,
              fontSize: 10,
              background: index === 0 ? "var(--ink)" : index === 1 ? "var(--accent)" : "#5E8A62",
              color: "var(--paper-2)",
              boxShadow: "0 2px 6px rgba(28,26,22,0.2)",
            }}
          >
            {planStopNumber}
          </span>
        )}
        {showRouteBadge && (
          <span
            className="absolute -top-1 -right-1 z-10 grid place-items-center rounded-full font-bold"
            style={{
              width: isActiveStop ? 18 : 16,
              height: isActiveStop ? 18 : 16,
              fontSize: isActiveStop ? 10 : 9,
              background: isActiveStop ? "var(--accent)" : "var(--ink)",
              color: "var(--paper-2)",
              boxShadow: isActiveStop ? "0 0 0 3px rgba(199,126,106,0.45)" : "0 2px 6px rgba(28,26,22,0.2)",
            }}
          >
            {stopIndex + 1}
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
            width: active ? 17 : 14,
            height: active ? 17 : 14,
            background: dotColor,
            border: "2.5px solid var(--paper-2)",
            boxShadow: active
              ? `0 8px 22px rgba(28,26,22,0.3), 0 0 0 1px ${dotColor}66`
              : "0 4px 12px rgba(28,26,22,0.24)",
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
