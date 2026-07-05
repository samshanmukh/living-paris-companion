import { useState } from "react";
import { motion } from "framer-motion";
import { Box, Compass, CloudRain, LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from "react-map-gl/mapbox";
import { useCityStore } from "@/store/useCityStore";
import { LAYOUT, topSafe } from "@/lib/layout";

const PARIS_CENTER: [number, number] = [2.3487, 48.855];

function CtrlButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -1 }}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center"
      style={{
        color: active ? "var(--accent-text)" : "var(--ink-2)",
        background: active ? "var(--accent-tint)" : "transparent",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {children}
    </motion.button>
  );
}

export function MapControls() {
  const { current: mapRef } = useMap();
  const [is3D, setIs3D] = useState(true);
  const rainMode = useCityStore((s) => s.rainMode);
  const setRainMode = useCityStore((s) => s.setRainMode);

  const getMap = () => mapRef?.getMap();

  const recenter = () => {
    getMap()?.flyTo({
      center: PARIS_CENTER,
      zoom: 14,
      pitch: is3D ? 55 : 0,
      bearing: 0,
      duration: 1400,
      curve: 1.5,
      essential: true,
    });
  };

  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        getMap()?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
          duration: 1400,
          essential: true,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const zoomIn = () => getMap()?.zoomIn({ duration: 300 });
  const zoomOut = () => getMap()?.zoomOut({ duration: 300 });

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    getMap()?.easeTo({ pitch: next ? 55 : 0, duration: 700 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 24 }}
      className="glass pointer-events-auto absolute z-20 overflow-hidden"
      style={{
        right: LAYOUT.inset,
        top: topSafe(),
        borderRadius: 18,
        width: LAYOUT.mapControlsW,
      }}
    >
      <CtrlButton onClick={recenter} label="Recenter Paris">
        <Compass size={18} strokeWidth={1.5} />
      </CtrlButton>
      <CtrlButton onClick={geolocate} label="My location">
        <LocateFixed size={18} strokeWidth={1.5} />
      </CtrlButton>
      <CtrlButton onClick={zoomIn} label="Zoom in">
        <Plus size={18} strokeWidth={1.5} />
      </CtrlButton>
      <CtrlButton onClick={zoomOut} label="Zoom out">
        <Minus size={18} strokeWidth={1.5} />
      </CtrlButton>
      <CtrlButton onClick={toggle3D} label={is3D ? "Switch to 2D" : "Switch to 3D"} active={is3D}>
        <Box size={18} strokeWidth={1.5} />
      </CtrlButton>
      <CtrlButton onClick={() => void setRainMode(!rainMode)} label={rainMode ? "Clear rain" : "Rain mode"} active={rainMode}>
        <CloudRain size={18} strokeWidth={1.5} />
      </CtrlButton>
    </motion.div>
  );
}
