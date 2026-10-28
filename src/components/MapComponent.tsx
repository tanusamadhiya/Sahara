import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Locate, ShieldAlert, Navigation } from "lucide-react";

interface MapComponentProps {
  responderActive: boolean;
  onEtaUpdate?: (eta: number, distance: number) => void;
  responderStatus: "sent" | "accepted" | "en_route" | "arrived";
  emergencyType?: string;
  theme?: "light" | "dark";
}

// Standard Haversine Formula helper to calculate real distance in km
function getHaversineDistance(coords1: [number, number], coords2: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coords2[0] - coords1[0]) * Math.PI) / 180;
  const dLon = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1[0] * Math.PI) / 180) *
      Math.cos((coords2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTileLayerUrl(theme: "light" | "dark"): string {
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY?.trim();
  if (apiKey) {
    const style = theme === "dark" ? "streets-v2-dark" : "streets-v2";
    return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;
  }

  return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

interface Responder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  offsetLat: number;
  offsetLng: number;
  type: "medical" | "police" | "fire" | "agro" | "volunteer";
}

export default function MapComponent({ responderActive, onEtaUpdate, responderStatus, emergencyType = "medical", theme = "light" }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const responderMarkersRef = useRef<Record<string, L.Marker>>({});
  const polylinesRef = useRef<Record<string, L.Polyline>>({});

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<"loading" | "success" | "fallback" | "denied">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [locationAttempt, setLocationAttempt] = useState(0);
  const [tileStatus, setTileStatus] = useState<"loading" | "ready" | "error">("loading");

  // Get exact user geolocation and watch position continuously
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("fallback");
      setErrorMsg("Geolocation not supported by browser.");
      return;
    }

    setGeoStatus("loading");
    setErrorMsg("");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords([latitude, longitude]);
        setGeoStatus("success");
        setErrorMsg("");
      },
      (error) => {
        console.warn("Geolocation watch error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("fallback");
        }
        setErrorMsg(error.message || "Permission denied.");
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [locationAttempt]);

  // Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset container if Leaflet previously initialized it (e.g. React StrictMode or remount)
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    let map: L.Map | null = null;
    try {
      map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
      });

      const hasMapTilerKey = Boolean(import.meta.env.VITE_MAPTILER_API_KEY?.trim());
      setTileStatus("loading");
      const tileLayer = L.tileLayer(getTileLayerUrl(theme), {
        attribution: hasMapTilerKey
          ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abcd",
        maxZoom: hasMapTilerKey ? 20 : 19,
      });
      tileLayer.on("tileload", () => setTileStatus("ready"));
      tileLayer.on("tileerror", () => {
        setTileStatus(status => status === "ready" ? status : "error");
      });
      tileLayerRef.current = tileLayer.addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      mapRef.current = map;
      requestAnimationFrame(() => map?.invalidateSize());
    } catch (e) {
      console.warn("Error initializing Leaflet map:", e);
    }

    return () => {
      // Clean up responder markers and polylines of the old map
      (Object.values(responderMarkersRef.current) as L.Marker[]).forEach(marker => {
        try { marker.remove(); } catch (e) {}
      });
      responderMarkersRef.current = {};

      (Object.values(polylinesRef.current) as L.Polyline[]).forEach(line => {
        try { line.remove(); } catch (e) {}
      });
      polylinesRef.current = {};

      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch (e) {}
        userMarkerRef.current = null;
      }

      if (map) {
        try {
          map.stop();
          map.remove();
        } catch (e) {}
      }
      tileLayerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (tileLayerRef.current) {
      setTileStatus("loading");
      tileLayerRef.current.setUrl(getTileLayerUrl(theme));
    }
  }, [theme]);

  // Show a marker only after the browser supplies a real GPS fix.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;
    try {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userCoords);
      } else {
        const userHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
            <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)]"></div>
          </div>
        `;
        const userIcon = L.divIcon({
          html: userHtml,
          className: "custom-div-icon",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        userMarkerRef.current = L.marker(userCoords, { icon: userIcon })
          .addTo(map)
          .bindPopup("<b>Live GPS location</b><br/>This marker follows your current device position.");
        map.setView(userCoords, 15, { animate: false });
      }
      requestAnimationFrame(() => map.invalidateSize());
    } catch (e) {
      console.warn("Error updating user coords on map:", e);
    }
  }, [userCoords]);

  // Define 5 active responders
  const respondersList: Responder[] = [
    { id: "amb_402", name: "Ambulance 402", emoji: "🚑", color: "#EF4444", offsetLat: 0.007, offsetLng: -0.006, type: "medical" },
    { id: "pol_108", name: "Patrol 108", emoji: "🚔", color: "#3B82F6", offsetLat: -0.005, offsetLng: 0.008, type: "police" },
    { id: "fire_55", name: "Engine 55", emoji: "🚒", color: "#F59E0B", offsetLat: 0.006, offsetLng: 0.007, type: "fire" },
    { id: "agro_7", name: "Agro Rescue 7", emoji: "🚜", color: "#10B981", offsetLat: -0.008, offsetLng: -0.005, type: "agro" },
    { id: "vol_mesh", name: "Mesh Bike 12", emoji: "🏍️", color: "#8B5CF6", offsetLat: 0.003, offsetLng: -0.004, type: "volunteer" }
  ];

  // Handle Responder Simulation (5 Responders moving)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !responderActive || !userCoords) {
      // Clean up all markers & polylines
      (Object.values(responderMarkersRef.current) as L.Marker[]).forEach(marker => {
        try { marker.remove(); } catch (e) {}
      });
      responderMarkersRef.current = {};

      (Object.values(polylinesRef.current) as L.Polyline[]).forEach(line => {
        try { line.remove(); } catch (e) {}
      });
      polylinesRef.current = {};
      return;
    }

    // Determine the active responder type based on emergencyType parameter
    // If emergency type is agro/rural, agro rescue is closest, etc.
    const activeId = emergencyType.toLowerCase().includes("crop") || emergencyType.toLowerCase().includes("animal") || emergencyType.toLowerCase().includes("well") || emergencyType.toLowerCase().includes("farmer")
      ? "agro_7"
      : emergencyType.toLowerCase().includes("fire") || emergencyType.toLowerCase().includes("flood") || emergencyType.toLowerCase().includes("gas") || emergencyType.toLowerCase().includes("storm")
      ? "fire_55"
      : emergencyType.toLowerCase().includes("police") || emergencyType.toLowerCase().includes("assault") || emergencyType.toLowerCase().includes("robbery") || emergencyType.toLowerCase().includes("shooter")
      ? "pol_108"
      : emergencyType.toLowerCase().includes("volunteer")
      ? "vol_mesh"
      : "amb_402";

    // Setup each responder
    respondersList.forEach(resp => {
      const startLat = userCoords[0] + resp.offsetLat;
      const startLng = userCoords[1] + resp.offsetLng;

      // Custom icon
      const rHtml = `
        <div class="relative flex flex-col items-center">
          <div class="absolute -top-1 w-6 h-6 rounded-full animate-pulse" style="background-color: ${resp.color}30"></div>
          <div class="px-1.5 py-0.5 bg-black/90 text-white text-[7px] font-mono font-bold rounded shadow border border-white/10 whitespace-nowrap mb-1">
            ${resp.name}
          </div>
          <div class="w-6 h-6 border border-white/20 rounded-full flex items-center justify-center shadow-lg" style="background-color: ${resp.color}">
            <span class="text-white text-xs">${resp.emoji}</span>
          </div>
        </div>
      `;
      const rIcon = L.divIcon({
        html: rHtml,
        className: "custom-div-icon",
        iconSize: [60, 40],
        iconAnchor: [30, 35],
      });

      const marker = L.marker([startLat, startLng], { icon: rIcon }).addTo(map);
      responderMarkersRef.current[resp.id] = marker;

      // Polyline route
      const routePoints: [number, number][] = [
        [startLat, startLng],
        [startLat - resp.offsetLat * 0.4, startLng - resp.offsetLng * 0.3],
        [startLat - resp.offsetLat * 0.8, startLng - resp.offsetLng * 0.7],
        [userCoords[0], userCoords[1]]
      ];

      const routePolyline = L.polyline(routePoints, {
        color: resp.color,
        weight: resp.id === activeId ? 3.5 : 1.5,
        opacity: resp.id === activeId ? 0.9 : 0.4,
        dashArray: "5, 5",
      }).addTo(map);

      polylinesRef.current[resp.id] = routePolyline;
    });

    // Fit map to contain all active responders and user
    // Safely check if elements are valid and belong to the current active map
    const allMarkers: L.Marker[] = [];
    if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
      allMarkers.push(userMarkerRef.current);
    }
    (Object.values(responderMarkersRef.current) as L.Marker[]).forEach(marker => {
      if (marker && map.hasLayer(marker)) {
        allMarkers.push(marker);
      }
    });

    if (allMarkers.length > 0) {
      try {
        const group = L.featureGroup(allMarkers);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
        }
      } catch (err) {
        console.warn("Could not fit map bounds:", err);
      }
    }

    // Animation interval (moves all responders closer to user)
    let progress = 0;
    const steps = 60; // 60 ticks for full transition

    const interval = setInterval(() => {
      progress += 1;
      if (progress > steps) {
        clearInterval(interval);
        return;
      }

      const t = progress / steps;

      respondersList.forEach(resp => {
        const startLat = userCoords[0] + resp.offsetLat;
        const startLng = userCoords[1] + resp.offsetLng;

        // Interpolate position closer to user coordinates
        const currLat = startLat + (userCoords[0] - startLat) * t;
        const currLng = startLng + (userCoords[1] - startLng) * t;

        const marker = responderMarkersRef.current[resp.id];
        if (marker && map && map.hasLayer(marker)) {
          try {
            marker.setLatLng([currLat, currLng]);
          } catch (e) {
            console.warn("Error updating responder marker position:", e);
          }
        }
      });

      // Calculate the physical distance for the primary active responder using the Haversine formula
      const activeResp = respondersList.find(r => r.id === activeId) || respondersList[0];
      const activeStartLat = userCoords[0] + activeResp.offsetLat;
      const activeStartLng = userCoords[1] + activeResp.offsetLng;
      const activeCurrLat = activeStartLat + (userCoords[0] - activeStartLat) * t;
      const activeCurrLng = activeStartLng + (userCoords[1] - activeStartLng) * t;

      const currentDistanceKm = getHaversineDistance([activeCurrLat, activeCurrLng], userCoords);

      // Disaster modifier (Floods, storms, etc. multiply ETA by 2.5x)
      const isDisaster = emergencyType.toLowerCase().includes("flood") || 
                        emergencyType.toLowerCase().includes("storm") || 
                        emergencyType.toLowerCase().includes("cyclone") || 
                        emergencyType.toLowerCase().includes("landslide");
      const multiplier = isDisaster ? 2.5 : 1.0;

      // Base ETA is roughly 1 minute per 0.8 kilometers, plus traffic offset
      const baseEta = (currentDistanceKm / 0.8) + 1.0;
      const finalEtaMinutes = Math.max(1, Math.round(baseEta * multiplier));

      if (onEtaUpdate) {
        onEtaUpdate(finalEtaMinutes, parseFloat(currentDistanceKm.toFixed(2)));
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      // Clean up all markers & polylines created in this effect run to prevent leaking across map rebuilds or active toggles
      (Object.values(responderMarkersRef.current) as L.Marker[]).forEach(marker => {
        try { marker.remove(); } catch (e) {}
      });
      responderMarkersRef.current = {};

      (Object.values(polylinesRef.current) as L.Polyline[]).forEach(line => {
        try { line.remove(); } catch (e) {}
      });
      polylinesRef.current = {};
    };
  }, [userCoords, responderActive, emergencyType]);

  return (
    <div id="secure-leaflet-map-container" className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-white/10 bg-[#0A0B10]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating map controls & location status */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161923]/95 backdrop-blur-md border border-white/10 rounded-full shadow-lg text-xs font-semibold text-[#E0E2E7]">
          <Locate className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span className="font-mono text-[10px]">
            {geoStatus === "loading" && "ACQUIRING GPS LOCK..."}
            {geoStatus === "success" && "GPS LOCATION LOCK: ACTIVE"}
            {geoStatus === "fallback" && "GPS LOCATION UNAVAILABLE"}
          </span>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900/90 border border-white/10 text-gray-300 rounded-full text-[9px] font-mono font-bold shadow-md">
            <span>
              {userCoords
                ? `COORDS: ${userCoords[0].toFixed(5)}, ${userCoords[1].toFixed(5)}`
                : "COORDS: WAITING FOR GPS"}
            </span>
          </div>
          {responderActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded-full text-[9px] font-mono font-bold shadow-md">
              <ShieldAlert className="w-3 h-3 animate-ping" />
              <span>5 RESPONDERS DISPATCHED</span>
            </div>
          )}
        </div>
      </div>

      {tileStatus === "error" && (
        <div className="absolute bottom-4 left-4 z-20 max-w-[min(24rem,calc(100%-5rem))] rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900 shadow-lg">
          Live GPS is active, but map tiles are unavailable. Check your connection or configure a valid MapTiler key.
        </div>
      )}

      {/* Custom Recenter Button */}
      <button
        onClick={() => {
          if (mapRef.current && userCoords) {
            mapRef.current.setView(userCoords, 16, { animate: true });
          }
        }}
        disabled={!userCoords}
        className="absolute bottom-4 right-4 z-20 w-10 h-10 bg-[#161923] hover:bg-[#0F111A] text-orange-500 border border-white/10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        title={userCoords ? "Recenter on live location" : "Waiting for GPS location"}
      >
        <Navigation className="w-4 h-4" />
      </button>

      {(geoStatus === "denied" || (geoStatus === "fallback" && !userCoords)) && (
        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 animate-pulse border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider">
              {geoStatus === "denied" ? "Location permission needed" : "Waiting for a GPS fix"}
            </h3>
            <p className="text-[11px] text-neutral-300 max-w-[340px] leading-relaxed">
              {errorMsg || "Allow location access in your browser. Live location requires a secure connection (HTTPS) or localhost."}
            </p>
          </div>
          <button 
            onClick={() => {
              setGeoStatus("loading");
              setLocationAttempt(attempt => attempt + 1);
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Try location again
          </button>
        </div>
      )}
    </div>
  );
}
