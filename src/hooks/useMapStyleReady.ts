import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/mapbox";

/** True once the Mapbox style is loaded — safe to mount <Source>/<Layer>. */
export function useMapStyleReady() {
  const { current: mapRef } = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef) {
      setReady(false);
      return;
    }

    const map = mapRef.getMap();
    const sync = () => setReady(map.isStyleLoaded());

    sync();
    map.on("load", sync);
    map.on("style.load", sync);
    map.on("styledata", sync);

    return () => {
      map.off("load", sync);
      map.off("style.load", sync);
      map.off("styledata", sync);
    };
  }, [mapRef]);

  return ready;
}
