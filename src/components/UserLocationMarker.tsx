import { motion } from "framer-motion";
import { Marker as MapMarker } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";

/** Shows the user's set location on the map ("You · République"). */
export function UserLocationMarker() {
  const userLocation = useCityStore((s) => s.userLocation);
  const locationLabel = useCityStore((s) => s.locationLabel);

  if (!userLocation) return null;
  const [lon, lat] = userLocation;

  return (
    <MapMarker longitude={lon} latitude={lat} anchor="center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      >
        {locationLabel && (
          <span
            className="glass-strong whitespace-nowrap rounded-full px-2.5 py-1"
            style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink)" }}
          >
            You · {locationLabel}
          </span>
        )}
        <span
          className="block rounded-full"
          style={{
            width: 14,
            height: 14,
            background: "#2f7ad9",
            border: "3px solid #fff",
            boxShadow: "0 0 0 4px rgba(47,122,217,0.25), 0 4px 12px rgba(28,26,22,0.2)",
          }}
        />
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: 28, height: 28,
            background: "rgba(47,122,217,0.15)",
            animation: "lp-pulse-ring 2s ease-out infinite",
          }}
        />
      </motion.div>
    </MapMarker>
  );
}
