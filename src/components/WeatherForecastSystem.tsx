import { useState, useEffect, useRef } from "react";
import { 
  Cloud, Sun, CloudRain, Wind, Droplets, Eye, Gauge, Compass, 
  SunDim, Moon, ShieldAlert, Volume2, VolumeX, Zap, TrendingUp, 
  RefreshCw, AlertOctagon, Locate, MapPin, Sparkles, Calendar, 
  WifiOff, Info, ChevronRight, X, HeartPulse, Shield, HelpCircle, EyeOff
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../utils/i18n";

interface WeatherForecastSystemProps {
  onClose: () => void;
  initialCoords?: { lat: number; lon: number } | null;
}

export default function WeatherForecastSystem({ onClose, initialCoords }: WeatherForecastSystemProps) {
  const { t } = useTranslation();
  // Coords State
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(initialCoords || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<"temp" | "precipitation" | "wind" | "warnings">("temp");

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapMarkerRef = useRef<L.Marker | null>(null);

  // Synchronous network listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const coordsRef = useRef<{ lat: number; lon: number } | null>(coords);
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Request user GPS permission and lock coordinates
  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setError("Please enable location to view your local weather forecast.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lon: longitude };
        setCoords(newCoords);
        fetchWeather(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation permission denied/failed:", err);
        setLoading(false);
        setError("Please enable location to view your local weather forecast.");
        setWeatherData(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Fetch Weather Data from our high-performance backend API proxy
  const fetchWeather = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        throw new Error(`Server returned error code: ${response.status}`);
      }
      const data = await response.json();
      setWeatherData(data);
      
      // Cache the result for offline usage
      localStorage.setItem("sahara_cached_weather", JSON.stringify(data));
      localStorage.setItem("sahara_weather_coords", JSON.stringify({ lat: latitude, lon: longitude }));

      // If critical warnings are present, trigger emergency audio sweep
      if (data.alerts && data.alerts.some((a: any) => a.severity === "CRITICAL")) {
        if (!isMuted) {
          playEmergencySweep();
          try {
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200, 100, 300]);
            }
          } catch (v) {}
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch live weather, attempting offline cache:", err);
      
      // Load offline cache
      const cached = localStorage.getItem("sahara_cached_weather");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setWeatherData(parsed);
          setIsOffline(true);
        } catch (parseErr) {
          setError("Please enable location to view your local weather forecast.");
        }
      } else {
        setError("Please enable location to view your local weather forecast.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Synth Alarm Sound Generator
  const playEmergencySweep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sine";
      // Intermittent warning sweep (high-frequency siren)
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(587, audioCtx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(587, audioCtx.currentTime + 0.75);
      osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 1.0);

      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.25);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.3);
    } catch (e) {
      console.warn("Synthesizer blocked by browser autoplays safety rules:", e);
    }
  };

  // Dynamic AI Weather Analysis & Suggestions generator
  const generateAISafetySuggestions = (data: any) => {
    const suggestions: { type: "danger" | "warning" | "info" | "success"; title: string; desc: string; icon: string }[] = [];

    if (!data || !data.current) return suggestions;

    const temp = data.current.temp;
    const weatherCode = data.current.weatherCode || 0;
    const windSpeed = data.current.windSpeed;
    const rainChance = data.daily?.[0]?.rainChance || data.hourly?.[0]?.rainChance || 0;

    let rainStartHour = "";
    if (data.hourly && Array.isArray(data.hourly)) {
      const rainItem = data.hourly.find((h: any) => h.rainChance > 35);
      if (rainItem) {
        rainStartHour = rainItem.time;
      }
    }

    // Heavy rain expected in X hours -> Recommend staying indoors
    if ([65, 81, 82, 95, 96, 99].includes(weatherCode) || rainChance > 70) {
      suggestions.push({
        type: "danger",
        title: "Heavy Rain Expected",
        desc: rainStartHour
          ? `Heavy rain expected in 2 hours (around ${rainStartHour}). We recommend staying indoors, securing loose objects, and checking drainage paths.`
          : "Heavy rainfall active in your area. We recommend staying indoors and avoiding waterlogged routes.",
        icon: "⛈"
      });
    } else if (rainStartHour) {
      suggestions.push({
        type: "warning",
        title: "Rain Expected Soon",
        desc: `Rain expected starting around ${rainStartHour}. We recommend staying indoors or carrying protective rain gear.`,
        icon: "🌧"
      });
    }

    // Heatwave -> Recommend drinking water and avoiding outdoor work
    if (temp >= 35 || data.current.uvIndex >= 7) {
      suggestions.push({
        type: "warning",
        title: "Heatwave Advisory",
        desc: `High heat (${temp}°C) and UV Index (${data.current.uvIndex}). Recommend drinking plenty of water, wearing sun protection, and avoiding outdoor work.`,
        icon: "🌡"
      });
    }

    // Thunderstorm -> Warn users to avoid open fields
    if ([95, 96, 99].includes(weatherCode) || (data.alerts && data.alerts.some((a: any) => a.type?.toLowerCase().includes("thunderstorm")))) {
      suggestions.push({
        type: "danger",
        title: "Thunderstorm Warning",
        desc: "Thunderstorm activity detected. Warn users to avoid open fields, tall trees, metallic objects, and stay inside safe shelters.",
        icon: "⚡"
      });
    }

    // Flood risk -> Display evacuation precautions
    if (data.alerts && data.alerts.some((a: any) => a.type?.toLowerCase().includes("flood") || a.description?.toLowerCase().includes("flood"))) {
      suggestions.push({
        type: "danger",
        title: "Flood Risk Active",
        desc: "High risk of flash flooding. Displaying evacuation precautions: move to higher ground immediately and stay off waterlogged roads.",
        icon: "🌊"
      });
    }

    // Strong winds
    if (windSpeed > 30) {
      suggestions.push({
        type: "warning",
        title: "High Wind Gusts",
        desc: `Strong winds detected (${windSpeed} km/h). Secure loose items and stay clear of trees or power lines.`,
        icon: "💨"
      });
    }

    // Default clear condition
    if (suggestions.length === 0) {
      suggestions.push({
        type: "success",
        title: "Calm Weather Conditions",
        desc: "Weather conditions are clear and safe for outdoor travel and daily activities.",
        icon: "🌤"
      });
    }

    return suggestions;
  };

  // Run on mount with watchPosition and 5-minute auto refresh
  useEffect(() => {
    // 1. Immediately request live GPS
    getGPSLocation();

    // 2. Watch position for immediate refresh on location change
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (
            !coordsRef.current ||
            Math.abs(coordsRef.current.lat - latitude) > 0.001 ||
            Math.abs(coordsRef.current.lon - longitude) > 0.001
          ) {
            const newCoords = { lat: latitude, lon: longitude };
            setCoords(newCoords);
            fetchWeather(latitude, longitude);
          }
        },
        (err) => {
          console.warn("watchPosition error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    // 3. Refresh weather every 5 minutes while app is open
    const interval = setInterval(() => {
      if (coordsRef.current) {
        fetchWeather(coordsRef.current.lat, coordsRef.current.lon);
      } else {
        getGPSLocation();
      }
    }, 300000); // 5 minutes = 300,000ms

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(interval);
    };
  }, []);

  // Sync Leaflet map rendering
  useEffect(() => {
    if (!weatherData || !mapContainerRef.current) return;

    const lat = weatherData.coordinates.lat;
    const lon = weatherData.coordinates.lon;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      try {
        // Create map
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([lat, lon], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19
        }).addTo(map);

        // Add zoom controls to bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Custom pulsing location marker
        const pulseHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="absolute w-4 h-4 rounded-full bg-blue-600 border border-white shadow-md"></div>
          </div>
        `;
        const customIcon = L.divIcon({
          html: pulseHtml,
          className: "custom-div-icon",
          iconSize: [24, 24]
        });

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs text-neutral-800">
            <b class="text-blue-600">Your GPS Location</b><br/>
            ${weatherData.location.village || weatherData.location.city || "Sahara Node"}
          </div>
        `).openPopup();

        mapInstanceRef.current = map;
        mapMarkerRef.current = marker;
      } catch (err) {
        console.warn("Weather forecast map init error:", err);
      }
    } else {
      // Update map center and marker
      try {
        const map = mapInstanceRef.current;
        map.setView([lat, lon], 12);
        if (mapMarkerRef.current) {
          mapMarkerRef.current.setLatLng([lat, lon]);
        }
      } catch (err) {
        console.warn("Weather forecast map update error:", err);
      }
    }

    // Adjust size safely and clear timer on unmount
    const timer = setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch (err) {}
    }, 200);

    return () => {
      clearTimeout(timer);
    };

  }, [weatherData, mapLayer]);

  // Clean map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        mapMarkerRef.current = null;
      }
    };
  }, []);

  // Locate me helper in map
  const handleLocateMeMap = () => {
    if (mapInstanceRef.current && weatherData) {
      mapInstanceRef.current.setView([weatherData.coordinates.lat, weatherData.coordinates.lon], 14);
      if (mapMarkerRef.current) {
        mapMarkerRef.current.openPopup();
      }
    }
  };

  // Helper to translate weather condition into dynamic animated classes/colors
  const getConditionStyle = (code: number) => {
    if ([0, 1].includes(code)) return { bg: "from-blue-400 to-sky-300", theme: "sunny" };
    if ([2, 3].includes(code)) return { bg: "from-sky-400 to-slate-300", theme: "cloudy" };
    if ([45, 48].includes(code)) return { bg: "from-slate-400 to-zinc-300", theme: "foggy" };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81].includes(code)) return { bg: "from-blue-500 to-slate-400", theme: "rainy" };
    if ([82, 95, 96, 99].includes(code)) return { bg: "from-indigo-900 to-slate-600", theme: "stormy" };
    return { bg: "from-blue-400 to-sky-300", theme: "sunny" };
  };

  // Air Quality indicator styling
  const getAQIStyle = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (aqi <= 100) return { label: "Moderate", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "text-orange-600 bg-orange-50 border-orange-200" };
    return { label: "Unhealthy / Hazardous", color: "text-red-600 bg-red-50 border-red-200" };
  };

  // Helper for safety risk rating badge colors
  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "Low": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Moderate": return "bg-amber-100 text-amber-800 border-amber-200";
      case "High": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Critical": return "bg-red-100 text-red-800 border-red-200 animate-pulse";
      default: return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[120] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
      
      {/* Dashboard Card Container */}
      <div className="bg-white text-slate-800 w-full md:max-w-4xl h-full md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-fade-in font-sans">
        
        {/* Header Ribbon */}
        <header className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-extrabold shadow-sm">
              🛰️
            </div>
            <div>
              <span className="font-mono text-[9px] font-black text-blue-600 uppercase tracking-widest block">{t("weather.forecastTitle")}</span>
              <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1">
                {t("common.appName")} {t("weather.forecastTitle")}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Silent Audio Switch */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all cursor-pointer"
              title={isMuted ? "Unmute Emergency Signals" : "Mute Emergency Signals"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-blue-500" />}
            </button>

            {/* Sync trigger */}
            <button
              onClick={() => {
                if (coords) fetchWeather(coords.lat, coords.lon);
                else getGPSLocation();
              }}
              disabled={loading}
              className={`p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all cursor-pointer ${loading ? "animate-spin text-blue-500" : "text-slate-600"}`}
              title="Refresh Live Geolocation Weather"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button 
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sync Offline Status banner */}
        {isOffline && (
          <div className="bg-amber-500 text-white text-xs px-4 py-2 font-semibold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 animate-bounce" />
              <span>Offline Mode — Displaying last successfully synchronized weather.</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
              Auto-Sync Pending
            </span>
          </div>
        )}

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
          
          {/* STEP 1: If permission denied or missing coords */}
          {error && !weatherData && (
            <div className="glass-panel bg-white border border-slate-200/60 rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-sm space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-500">
                <MapPin className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">GPS Access Required</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {error}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={getGPSLocation}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase rounded-2xl tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  <Locate className="w-4 h-4" />
                  Grant Location & Load
                </button>
              </div>
            </div>
          )}

          {/* Loading Shimmer State */}
          {loading && !weatherData && (
            <div className="space-y-6 animate-pulse">
              <div className="h-48 bg-slate-200 rounded-3xl" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
                ))}
              </div>
              <div className="h-44 bg-slate-200 rounded-3xl" />
            </div>
          )}

          {/* STEP 2: Main Weather Core Widgets Dashboard */}
          {weatherData && (
            <div className="space-y-6">
              
              {/* CURRENT LIVE GPS LOCATION PANEL */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">GPS Locked Location</span>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-1">
                      {weatherData.location.city || weatherData.location.village || weatherData.location.district || "Current Location"}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {weatherData.location.district && weatherData.location.district !== weatherData.location.city ? `${weatherData.location.district}, ` : ""}
                      {weatherData.location.state ? `${weatherData.location.state}, ` : ""}
                      {weatherData.location.country || "IN"}
                    </p>
                  </div>
                </div>

                <div className="flex items-end md:text-right gap-4 md:gap-0 justify-between md:flex-col border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Current Time</span>
                    <span className="text-xs font-black text-slate-800">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="md:mt-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Last Synchronized</span>
                    <span className="text-xs font-bold text-blue-500">
                      {new Date(weatherData.current.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEVERE EMERGENCY WEATHER ALERTS GRID */}
              {weatherData.alerts && weatherData.alerts.length > 0 && (
                <div className="space-y-3">
                  {weatherData.alerts.map((alert: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`border rounded-3xl p-5 shadow-lg relative overflow-hidden flex items-start gap-4 transition-all ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-50 border-red-200 text-red-950"
                          : "bg-amber-50 border-amber-200 text-amber-950"
                      }`}
                    >
                      {/* Alert Left decorative accent bar */}
                      <div className={`absolute top-0 left-0 bottom-0 w-2 ${alert.severity === "CRITICAL" ? "bg-red-500" : "bg-amber-500"}`} />
                      
                      {/* Critical visual beacon pulsing */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                        alert.severity === "CRITICAL" ? "bg-red-100 text-red-600 animate-pulse" : "bg-amber-100 text-amber-600"
                      }`}>
                        {alert.icon || "⚠️"}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider ${
                            alert.severity === "CRITICAL" ? "bg-red-200 text-red-800 animate-bounce" : "bg-amber-200 text-amber-800"
                          }`}>
                            🚨 {alert.severity} WEATHER ALERT
                          </span>
                          {!isMuted && alert.severity === "CRITICAL" && (
                            <span className="text-[8px] font-mono text-red-500 font-black tracking-widest animate-pulse">
                              🔊 SIREN SIGNAL ACTIVE
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black tracking-tight">{alert.type} Detected</h4>
                        <p className="text-xs leading-relaxed text-slate-600">{alert.description}</p>
                        
                        <div className="pt-2 border-t border-slate-200/50 mt-1">
                          <span className="font-mono text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Recommended Safety Actions</span>
                          <p className="text-xs text-slate-800 font-bold mt-1 bg-white/60 p-2.5 rounded-xl border border-slate-200/30">
                            👉 {alert.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CURRENT WEATHER HERO GRADIENT CARD */}
              <div className={`rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg bg-gradient-to-r ${getConditionStyle(weatherData.current.conditionCode).bg} transition-all`}>
                
                {/* Visual Weather Animation Layer (Pure CSS overlays for premium Lottie/canvas feel) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
                  {getConditionStyle(weatherData.current.conditionCode).theme === "rainy" && (
                    <div className="absolute inset-0 rain-animation"></div>
                  )}
                  {getConditionStyle(weatherData.current.conditionCode).theme === "sunny" && (
                    <div className="absolute inset-0 sun-flare"></div>
                  )}
                  {getConditionStyle(weatherData.current.conditionCode).theme === "stormy" && (
                    <div className="absolute inset-0 lightning-flashes"></div>
                  )}
                  {getConditionStyle(weatherData.current.conditionCode).theme === "cloudy" && (
                    <div className="absolute inset-0 cloud-drifts"></div>
                  )}
                </div>

                {/* Card Content Grid */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left block: Temperatures */}
                  <div className="space-y-4">
                    <span className="px-3 py-1 bg-white/20 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm inline-block">
                      {weatherData.current.conditionText}
                    </span>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl md:text-7xl font-black tracking-tighter leading-none">
                        {weatherData.current.temp}°C
                      </span>
                      <span className="text-sm font-semibold opacity-80">
                        Feels like {weatherData.current.feelsLike}°C
                      </span>
                    </div>

                    <p className="text-xs md:text-sm leading-relaxed opacity-90 max-w-sm">
                      Currently witnessing <b>{weatherData.current.conditionText.toLowerCase()}</b> across your exact micro-location. Safety protocols are primed.
                    </p>
                  </div>

                  {/* Right block: High/Low & Weather Prediction */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold font-mono">TODAY'S SPECS</span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                        {weatherData.daily[0]?.day || "Today"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] opacity-70 block font-mono uppercase tracking-widest">Highest Temp</span>
                        <span className="text-sm font-extrabold">{weatherData.daily[0]?.maxTemp}°C</span>
                      </div>
                      <div>
                        <span className="text-[9px] opacity-70 block font-mono uppercase tracking-widest">Lowest Temp</span>
                        <span className="text-sm font-extrabold">{weatherData.daily[0]?.minTemp}°C</span>
                      </div>
                    </div>

                    <div className="bg-white/10 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[8px] font-mono font-black opacity-80 uppercase block tracking-wider">Rain Start Time & Probability</span>
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        {(() => {
                          const rainItem = weatherData.hourly?.find((h: any) => h.rainChance > 35);
                          if (rainItem) {
                            return `☔ Rain expected starting at ${rainItem.time} (${rainItem.rainChance}% chance)`;
                          }
                          return `☀ ${weatherData.rainPrediction || "No rain expected in next 12 hours"}`;
                        })()}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* DYNAMIC AI SAFETY SUGGESTIONS & ANALYSIS */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
                    ✨
                  </div>
                  <div>
                    <span className="font-mono text-[8px] font-black text-amber-600 uppercase tracking-widest block">Real-Time Analysis</span>
                    <h3 className="text-sm font-black text-slate-800">AI Safety Recommendations</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generateAISafetySuggestions(weatherData).map((sug, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border space-y-1.5 ${
                        sug.type === "danger"
                          ? "bg-red-50/80 border-red-200/80 text-red-950"
                          : sug.type === "warning"
                          ? "bg-amber-50/80 border-amber-200/80 text-amber-950"
                          : "bg-emerald-50/80 border-emerald-200/80 text-emerald-950"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{sug.icon}</span>
                        <h4 className="text-xs font-black tracking-tight">{sug.title}</h4>
                      </div>
                      <p className="text-xs leading-relaxed font-medium opacity-90">
                        {sug.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FARMER RURAL WEATHER MODE */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      🌾
                    </div>
                    <div>
                      <span className="font-mono text-[8px] font-black text-emerald-600 uppercase tracking-widest block">Krishi Helpdesk</span>
                      <h3 className="text-sm font-black text-slate-800">Farmer Weather Advisory Mode</h3>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                    Rural-First
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {weatherData.farmerAdvisories && weatherData.farmerAdvisories.map((adv: any, i: number) => (
                    <div 
                      key={i} 
                      className={`border rounded-2xl p-4.5 space-y-2.5 shadow-sm bg-slate-50/50 ${
                        adv.severity === "DANGER" ? "border-red-200/60 bg-red-50/10" :
                        adv.severity === "WARNING" ? "border-amber-200/60 bg-amber-50/10" : "border-emerald-200/60 bg-emerald-50/10"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-slate-800">{adv.topic}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider ${
                          adv.status === "AVOID" || adv.status === "SUSPEND" || adv.status === "EMERGENCY" ? "bg-red-100 text-red-700" :
                          adv.status === "DELAY" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {adv.status}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 font-medium">
                        {adv.message}
                      </p>
                    </div>
                  ))}
                </div>

                {/* General Crop Advisory informational block */}
                <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-start">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-700 font-mono uppercase tracking-widest block">General Crop Advisory (Informational Only)</span>
                    <p className="text-xs leading-relaxed text-slate-600 font-medium">
                      Ensure all freshly harvested Rabi stalks are stacked on elevated platforms with tarps. Check water drains inside cotton fields to avoid water-logging in case of light showers. Protect young nursery sprouts with simple mesh roofs.
                    </p>
                  </div>
                </div>
              </div>

              {/* PRIMARY WEATHER DETAILS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                
                {/* Humidity */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">{t("weather.humidity")}</span>
                    <span className="text-sm font-black text-slate-800">{weatherData.current.humidity}%</span>
                  </div>
                </div>

                {/* Wind */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">{t("weather.wind")}</span>
                    <span className="text-sm font-black text-slate-800">{weatherData.current.windSpeed} km/h</span>
                  </div>
                </div>

                {/* Barometric Pressure */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">Pressure</span>
                    <span className="text-sm font-black text-slate-800">{weatherData.current.pressure} hPa</span>
                  </div>
                </div>

                {/* UV Index */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <SunDim className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">UV Index</span>
                    <span className="text-sm font-black text-slate-800">{weatherData.current.uvIndex}</span>
                  </div>
                </div>

                {/* Air Quality Index (AQI) */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 text-slate-600 flex items-center justify-center shrink-0">
                    🌲
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">Air Quality (AQI)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-slate-800">{weatherData.current.aqi}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${getAQIStyle(weatherData.current.aqi).color}`}>
                        {getAQIStyle(weatherData.current.aqi).label.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">Visibility</span>
                    <span className="text-sm font-black text-slate-800">{weatherData.current.visibility} km</span>
                  </div>
                </div>

                {/* Dew Point */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-400 flex items-center justify-center shrink-0">
                    💧
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">Dew Point</span>
                    <span className="text-sm font-black text-slate-800">{weatherData.current.dewPoint}°C</span>
                  </div>
                </div>

                {/* Moon Phase */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-4 flex gap-3.5 items-center shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg shrink-0">
                    {weatherData.current.moonPhase.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">Moon Phase</span>
                    <span className="text-xs font-black text-slate-800 truncate block max-w-[100px]" title={weatherData.current.moonPhase.name}>
                      {weatherData.current.moonPhase.name}
                    </span>
                  </div>
                </div>

              </div>

              {/* DISASTER PREDICTION & INDICATORS PANEL */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                    <div>
                      <span className="font-mono text-[8px] font-black text-red-500 uppercase tracking-widest block">Predictive Analytics</span>
                      <h3 className="text-sm font-black text-slate-800">Dynamic Disaster Risk Matrix</h3>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(weatherData.disasterRisks).map(([riskName, riskLevel]: any) => (
                    <div key={riskName} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold capitalize text-slate-700">{riskName} Risk</span>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[8px] font-bold border uppercase tracking-wider ${getRiskBadgeColor(riskLevel)}`}>
                          {riskLevel}
                        </span>
                      </div>

                      {/* Small visual slider bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            riskLevel === "Low" ? "bg-emerald-500 w-[25%]" :
                            riskLevel === "Moderate" ? "bg-amber-500 w-[50%]" :
                            riskLevel === "High" ? "bg-orange-500 w-[75%]" : "bg-red-500 w-full animate-pulse"
                          }`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HOURLY 24-HOUR FORECAST CHART CARD */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <div>
                      <span className="font-mono text-[8px] font-black text-blue-600 uppercase tracking-widest block">Diurnal Progression</span>
                      <h3 className="text-sm font-black text-slate-800">Hourly Forecast (Next 24 Hours)</h3>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400">Swipe horizontally ↔</span>
                </div>

                {/* Horizontal scroll view */}
                <div className="flex gap-4.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                  {weatherData.hourly && weatherData.hourly.map((hour: any, i: number) => (
                    <div 
                      key={i}
                      className="flex-col items-center justify-center text-center p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-2xl min-w-[76px] border border-slate-100 snap-center transition-all shadow-sm space-y-2 shrink-0 group"
                    >
                      <span className="text-[10px] font-black text-slate-400 font-mono uppercase group-hover:text-blue-500 transition-colors">
                        {hour.time}
                      </span>
                      <div className="text-xl">
                        {hour.conditionIcon}
                      </div>
                      <div className="text-xs font-extrabold text-slate-800">
                        {hour.temp}°C
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-blue-500 block">
                          ☔ {hour.rainChance}%
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 block">
                          💧 {hour.humidity}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* INTERACTIVE GEOGRAPHIC WEATHER MAP */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-500 animate-pulse" />
                    <div>
                      <span className="font-mono text-[8px] font-black text-blue-600 uppercase tracking-widest block">Geographic Overlay</span>
                      <h3 className="text-sm font-black text-slate-800">Interactive Emergency Weather Map</h3>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setMapLayer("temp")}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${mapLayer === "temp" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Temp
                    </button>
                    <button
                      onClick={() => setMapLayer("precipitation")}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${mapLayer === "precipitation" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Rain Radar
                    </button>
                    <button
                      onClick={() => setMapLayer("wind")}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${mapLayer === "wind" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Wind Layer
                    </button>
                  </div>
                </div>

                {/* Map Box */}
                <div className="w-full h-72 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200/40 z-10">
                  <div ref={mapContainerRef} className="w-full h-full z-10" />

                  {/* Map Controls */}
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                    <button
                      onClick={handleLocateMeMap}
                      className="p-2.5 bg-white text-blue-600 rounded-xl shadow-lg border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase"
                      title="Locate Me"
                    >
                      <Locate className="w-4 h-4 animate-pulse" />
                      <span>My GPS</span>
                    </button>
                  </div>

                  {/* Map Layer Legend Overlay */}
                  <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-slate-100 text-[10px] font-bold max-w-xs space-y-1">
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">Active Map Layer</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-slate-700 capitalize font-extrabold">{mapLayer} Radar Overlay</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">Showing highly accurate spatial atmospheric telemetry at coordinates.</p>
                  </div>
                </div>
              </div>

              {/* 7-DAY EXTENDED FORECAST TIMELINE */}
              <div className="bg-white border border-slate-200/50 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <span className="font-mono text-[8px] font-black text-blue-600 uppercase tracking-widest block">Macro Overview</span>
                      <h3 className="text-sm font-black text-slate-800">7-Day Extended Outlook</h3>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {weatherData.daily && weatherData.daily.map((day: any, i: number) => (
                    <div key={i} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                      
                      {/* Day and icon */}
                      <div className="flex items-center gap-4 min-w-[140px]">
                        <span className="text-3xl shrink-0">{day.conditionIcon}</span>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{day.day}</h4>
                          <p className="text-[10px] font-semibold text-slate-400 font-mono uppercase">
                            {day.conditionText}
                          </p>
                        </div>
                      </div>

                      {/* Rain Probability slider representation */}
                      <div className="flex-1 flex items-center gap-2.5 max-w-sm">
                        <span className="text-[9px] font-mono font-bold text-slate-400">Rain Chance</span>
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all" 
                            style={{ width: `${day.rainChance}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 font-mono shrink-0 min-w-[32px] text-right">
                          {day.rainChance}%
                        </span>
                      </div>

                      {/* Daily Sunrise / Sunset */}
                      <div className="hidden md:flex gap-4 text-[10px] font-mono font-bold text-slate-400">
                        <span>🌅 {day.sunrise}</span>
                        <span>🌇 {day.sunset}</span>
                      </div>

                      {/* High/Low Temperature */}
                      <div className="flex items-baseline justify-end gap-3 shrink-0 min-w-[90px] text-right">
                        <span className="text-xs font-black text-slate-800">
                          {day.maxTemp}°C
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {day.minTemp}°C
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Styled pure CSS weather animation variables injected into document body */}
      <style>{`
        .rain-animation {
          background-image: linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
          background-size: 3px 150px;
          animation: rain-fall 0.8s linear infinite;
          width: 100%;
          height: 100%;
        }
        @keyframes rain-fall {
          0% { background-position: 0px -150px; }
          100% { background-position: 80px 450px; }
        }
        
        .sun-flare {
          background: radial-gradient(circle at 80% 20%, rgba(253,224,71,0.3) 0%, rgba(253,224,71,0) 60%);
          animation: sun-pulse 4s ease-in-out infinite alternate;
        }
        @keyframes sun-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0.9; }
        }

        .lightning-flashes {
          animation: lightning-strike 5s ease-in-out infinite;
        }
        @keyframes lightning-strike {
          0%, 94%, 96%, 98%, 100% { background-color: rgba(255,255,255,0); }
          95%, 97% { background-color: rgba(255,255,255,0.45); }
        }

        .cloud-drifts {
          background: radial-gradient(circle at 10% 40%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%),
                      radial-gradient(circle at 50% 60%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%);
          animation: clouds-move 12s linear infinite;
        }
        @keyframes clouds-move {
          0% { background-position: 0% 0%; }
          100% { background-position: 200px 0%; }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 99px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.4);
        }
      `}</style>

    </div>
  );
}
