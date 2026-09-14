"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Flies the map view to a new centre without remounting the MapContainer.
 * Must be rendered as a child of <MapContainer>.
 */
export default function AdminMapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 16, { duration: 1.2 });
  }, [center, map]);

  return null;
}
