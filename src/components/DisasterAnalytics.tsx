import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Flame, 
  Droplets, 
  CloudLightning, 
  CloudRain, 
  Sun, 
  Wind, 
  Check, 
  AlertCircle, 
  Settings, 
  Newspaper, 
  Compass,
  Bell,
  Sliders,
  Eye,
  Info
} from "lucide-react";
import { playWarningBeep } from "../utils/sirenSynth";

interface EmergencyAlert {
  id: string;
  title: string;
  category: "weather" | "disaster" | "national" | "state" | "nearby";
  severity: "critical" | "high" | "medium";
  distance: number; // km
  region: string;
  message: string;
  timestamp: string;
  agency: string;
}

export default function DisasterAnalytics() {
  // Base default alerts
  const defaultAlerts: EmergencyAlert[] = [
    {
      id: "a1",
      title: "Severe Flood & Tidal Inundation Warning",
      category: "disaster",
      severity: "critical",
      distance: 22, // 20-50 km triggers High Priority Alert popup
      region: "Mumbai East Coast and Lowlands",
      message: "Our deep learning flood models report 92% inundation likelihood for coastal districts in the next 12 hours due to high astronomical tide blockages combined with heavy storm precipitation.",
      timestamp: "10 mins ago",
      agency: "National Disaster Management Authority"
    },
    {
      id: "a2",
      title: "Torrential Rain & Monsoon Orange Alert",
      category: "weather",
      severity: "high",
      distance: 14,
      region: "Mumbai Metropolitan Sector",
      message: "Extreme rainfall exceedance event (>120mm/hr) predicted. Localized waterlogging expected near low-lying roads. Drive with extreme caution.",
      timestamp: "25 mins ago",
      agency: "India Meteorological Department (IMD)"
    },
    {
      id: "a3",
      title: "National Emergency Healthcare Preparedness",
      category: "national",
      severity: "medium",
      distance: 190,
      region: "All Regional Sectors",
      message: "Annual emergency medicine and vaccine cold chain readiness protocols active. All public health center databases are synchronizing blockchain-signed inventory proof.",
      timestamp: "2 hours ago",
      agency: "Ministry of Health & Family Welfare"
    },
    {
      id: "a4",
      title: "Critical Bridge & Bypass Structural Closure",
      category: "state",
      severity: "high",
      distance: 45, // 20-50 km triggers High Priority Alert popup
      region: "Western Highway Sector 4 Bypass",
      message: "Minor river swells have exceeded structural safety margins. Traffic diverted to active disaster-bypass corridors.",
      timestamp: "3 hours ago",
      agency: "State Highway Authority & PCR"
    }
  ];

  // Load from local storage or fall back to default
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(() => {
    const cached = localStorage.getItem("sahara_emergency_alerts");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return defaultAlerts;
      }
    }
    return defaultAlerts;
  });

  // Active filter state
  const [filter, setFilter] = useState<"all" | "nearby" | "weather" | "disasters" | "national">("all");

  // Notification category toggles
  const [toggles, setToggles] = useState(() => {
    const cached = localStorage.getItem("sahara_alert_settings");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return {
          weather: true,
          disaster: true,
          national: true,
          state: true,
          nearby: true
        };
      }
    }
    return {
      weather: true,
      disaster: true,
      national: true,
      state: true,
      nearby: true
    };
  });

  // Offline / Online state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // High Priority Active Popup alert state (triggers if distance in range 20-50 km and not dismissed)
  const [highPriorityAlert, setHighPriorityAlert] = useState<EmergencyAlert | null>(null);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<string[]>(() => {
    const cached = localStorage.getItem("sahara_acknowledged_alerts");
    return cached ? JSON.parse(cached) : [];
  });

  const [showSettings, setShowSettings] = useState(false);

  // Recharts predictive risk timeline
  const [chartData] = useState([
    { time: "00:00", stormRisk: 12, floodIndex: 8 },
    { time: "04:00", stormRisk: 25, floodIndex: 15 },
    { time: "08:00", stormRisk: 42, floodIndex: 30 },
    { time: "12:00", stormRisk: 78, floodIndex: 55 },
    { time: "16:00", stormRisk: 92, floodIndex: 84 },
    { time: "20:00", stormRisk: 65, floodIndex: 72 },
    { time: "24:00", stormRisk: 30, floodIndex: 45 },
  ]);

  // Handle Online/Offline sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Simulate refetching latest alerts
      const updated = [...alerts];
      localStorage.setItem("sahara_emergency_alerts", JSON.stringify(updated));
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [alerts]);

  // Trigger high priority alarm and vibration if any active alert falls inside 20-50km
  useEffect(() => {
    const findCloseAlert = alerts.find(
      (a) => a.distance >= 20 && a.distance <= 50 && !acknowledgedAlertIds.includes(a.id) && toggles[a.category]
    );

    if (findCloseAlert) {
      setHighPriorityAlert(findCloseAlert);
      
      // Vibrate on supported devices
      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
      
      // Play high-frequency warning sound
      playWarningBeep();
      const interval = setInterval(() => {
        playWarningBeep();
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setHighPriorityAlert(null);
    }
  }, [alerts, acknowledgedAlertIds, toggles]);

  // Persist toggles to localStorage
  const handleToggle = (key: keyof typeof toggles) => {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    localStorage.setItem("sahara_alert_settings", JSON.stringify(updated));
  };

  // Acknowledge a high priority alert
  const handleAcknowledgeAlert = (id: string) => {
    const updatedIds = [...acknowledgedAlertIds, id];
    setAcknowledgedAlertIds(updatedIds);
    localStorage.setItem("sahara_acknowledged_alerts", JSON.stringify(updatedIds));
    setHighPriorityAlert(null);
  };

  // Filter logic
  const filteredAlerts = alerts.filter((alert) => {
    // Check if toggled on in notification settings
    if (!toggles[alert.category]) return false;

    if (filter === "all") return true;
    if (filter === "nearby") return alert.distance <= 30;
    if (filter === "weather") return alert.category === "weather";
    if (filter === "disasters") return alert.category === "disaster";
    if (filter === "national") return alert.category === "national";
    return true;
  });

  return (
    <div className="space-y-6 max-w-[600px] mx-auto px-4 py-4 select-none animate-fade-in pb-20">
      
      {/* High Priority Full-screen Critical Popup */}
      {highPriorityAlert && (
        <div className="fixed inset-0 bg-red-950/95 backdrop-blur-2xl z-[999] flex flex-col items-center justify-center p-6 text-white space-y-6 animate-fade-in">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 bg-red-600/30 rounded-full animate-ping" />
            <div className="w-16 h-16 bg-red-600 border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.7)]">
              <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
            </div>
          </div>

          <div className="text-center space-y-2 max-w-[320px]">
            <span className="font-mono text-[9px] bg-red-600 border border-red-400 px-3 py-1 rounded-full text-red-100 font-extrabold uppercase tracking-widest animate-pulse">
              CRITICAL PROXIMITY ALERT
            </span>
            <h2 className="text-lg font-sans font-black tracking-tight text-white uppercase mt-2">
              {highPriorityAlert.title}
            </h2>
            <p className="text-[10px] text-red-400 font-bold font-mono">
              PROXIMITY: {highPriorityAlert.distance} km away • {highPriorityAlert.region}
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed pt-2">
              {highPriorityAlert.message}
            </p>
          </div>

          <div className="flex gap-2 items-center bg-red-900/40 border border-red-500/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[9px] text-red-300 font-mono font-bold uppercase">{highPriorityAlert.agency}</span>
          </div>

          <button 
            onClick={() => handleAcknowledgeAlert(highPriorityAlert.id)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
          >
            Acknowledge & Mute Alert
          </button>
        </div>
      )}

      {/* Offline Alert Handler Status Header */}
      {!isOnline && (
        <div className="p-3 bg-amber-600/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-mono flex items-center justify-between animate-pulse">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            OFFLINE MODE — Showing cached emergency alerts
          </span>
          <span className="text-[9px] bg-amber-500/20 px-2 py-0.5 rounded uppercase font-bold">CACHED</span>
        </div>
      )}

      {/* A. Sleek Apple-styled Weather & Disaster Panel Widget */}
      <section className="glass-panel p-5 rounded-2xl relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-white/10 shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-widest">
              <Compass className="w-3.5 h-3.5 text-orange-500 animate-spin-slow" />
              <span>SATELLITE ATMOSPHERICS</span>
            </div>
            <h2 className="text-3xl font-sans font-black tracking-tight text-white flex items-baseline gap-1">
              28°C <span className="text-sm text-neutral-400 font-medium font-sans">Mumbai</span>
            </h2>
          </div>
          <div className="text-right space-y-1">
            <span className="text-xs font-bold text-orange-400 flex items-center justify-end gap-1">
              <CloudRain className="w-4 h-4 text-orange-400 animate-bounce" /> Torrential Rain
            </span>
            <span className="text-[9px] font-mono font-bold text-neutral-500 block">HUMIDITY: 94%</span>
          </div>
        </div>

        {/* 4-Column Atmospheric metrics */}
        <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-white/5">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center space-y-1">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">AQI Index</span>
            <p className="text-xs font-black text-emerald-400">42 (Good)</p>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[42%]" />
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center space-y-1">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">UV Index</span>
            <p className="text-xs font-black text-orange-400">1 (Low)</p>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-orange-400 h-full w-[10%]" />
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center space-y-1">
            <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Wind speed</span>
            <p className="text-xs font-black text-blue-400">24 km/h</p>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full w-[60%]" />
            </div>
          </div>
        </div>
      </section>

      {/* B. Filter and Settings Controls */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          {/* Quick Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pr-2">
            {[
              { id: "all", label: "All" },
              { id: "nearby", label: "Nearby" },
              { id: "weather", label: "Weather" },
              { id: "disasters", label: "Disasters" },
              { id: "national", label: "National" }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border shrink-0 cursor-pointer ${
                  filter === chip.id
                    ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-950/20"
                    : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              showSettings 
                ? "bg-orange-600 text-white border-orange-500" 
                : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10"
            }`}
            title="Notification Filter Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Notification Category Toggles Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3.5 animate-fade-in shadow-inner">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                Alert Routing Subscriptions
              </h4>
              <span className="text-[8px] text-gray-500 font-semibold font-mono">TOGGLE TO ROUTE</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "disaster", label: "Floods & Disasters", icon: Flame },
                { id: "weather", label: "Severe Weather", icon: CloudLightning },
                { id: "national", label: "National Directives", icon: ShieldAlert },
                { id: "state", label: "State Advisories", icon: Info },
                { id: "nearby", label: "Nearby Warnings (<30km)", icon: AlertTriangle }
              ].map((category) => {
                const IconComp = category.icon;
                const isChecked = toggles[category.id as keyof typeof toggles];
                return (
                  <div 
                    key={category.id}
                    onClick={() => handleToggle(category.id as any)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked 
                        ? "bg-orange-600/10 border-orange-500/20 text-white" 
                        : "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComp className={`w-3.5 h-3.5 ${isChecked ? "text-orange-500 animate-pulse" : "text-neutral-500"}`} />
                      <span className="text-[10px] font-bold font-sans">{category.label}</span>
                    </div>
                    <div className={`w-6.5 h-4 rounded-full p-0.5 transition-all flex items-center ${isChecked ? "bg-orange-600 justify-end" : "bg-neutral-800 justify-start"}`}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* C. Active Emergency Bulletins List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-sans text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-neutral-500 animate-swing" />
            Active Regional Warnings
          </h3>
          <span className="font-mono text-[9px] text-neutral-500 font-bold uppercase">
            {filteredAlerts.length} Bulletins Matching
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-white/5 bg-white/5 space-y-2 text-neutral-400">
            <Check className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
            <p className="text-xs font-sans font-bold text-neutral-300">All Systems Clear</p>
            <p className="text-[10px] text-neutral-500 font-medium px-6 leading-relaxed">
              No active alerts registered in selected categories. Change filters or settings to view other alerts.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  alert.severity === "critical" 
                    ? "border-red-500/25 bg-red-950/10" 
                    : alert.severity === "high"
                    ? "border-orange-500/20 bg-orange-950/5"
                    : "border-white/5 bg-white/5"
                }`}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="space-y-1 max-w-[70%]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        alert.severity === "critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                          : alert.severity === "high"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-neutral-500">
                        {alert.timestamp} • {alert.distance} km away
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white leading-snug mt-1">{alert.title}</h4>
                  </div>

                  <span className="font-mono text-[8px] text-neutral-400 font-bold uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                    {alert.category}
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed text-neutral-300 font-medium mb-3.5">
                  {alert.message}
                </p>

                <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[9px] font-mono font-bold text-neutral-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>LOC: {alert.region}</span>
                  </div>
                  <span className="text-neutral-500 font-semibold">{alert.agency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* D. Predictive Threat Development Area Charts */}
      <section className="glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-b from-neutral-900 to-neutral-950 space-y-4">
        <div className="space-y-1">
          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-500 animate-pulse" /> Risk Forecast (24h Timeline)
          </h3>
          <p className="text-[11px] text-neutral-400 leading-normal">
            Neural forecast model projecting atmospheric flood buildup index and lightning thunder risks.
          </p>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-44 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStorm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#737373', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fill: '#737373', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ background: '#161923', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '10px', fontWeight: '600', color: '#E0E2E7' }} 
                itemStyle={{ color: '#E0E2E7' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area 
                type="monotone" 
                dataKey="stormRisk" 
                stroke="#ea580c" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorStorm)" 
                name="Storm Risk"
              />
              <Area 
                type="monotone" 
                dataKey="floodIndex" 
                stroke="#dc2626" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorFlood)" 
                name="Flood Accumulation"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-5 text-[9px] font-bold font-mono text-neutral-500 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-600" />
            <span>STORM ACTIVITY PROBABILITY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-600" />
            <span>FLOOD ACCUMULATION INDEX</span>
          </div>
        </div>
      </section>

      {/* E. Live Emergency News Bulletins Feed */}
      <section className="space-y-4">
        <h3 className="font-sans text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Newspaper className="w-4 h-4 text-neutral-500" />
          Live Official Agency Bulletins
        </h3>

        <div className="space-y-3">
          {[
            {
              time: "2 mins ago",
              title: "NDRF dispatches 6 rescue boat teams to low-lying sectors.",
              source: "National Response Corps",
              urgent: true
            },
            {
              time: "15 mins ago",
              title: "Decentralized emergency medical path locked and cleared on SAHARA regional ledger.",
              source: "Sahara Coordinator Node 32",
              urgent: false
            },
            {
              time: "1 hour ago",
              title: "Adjoining state volunteer mesh confirms 104 solar-powered backup charging points online.",
              source: "Active Volunteer Grid",
              urgent: false
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-3.5 rounded-xl border border-white/5 bg-white/5 flex gap-3.5 items-start">
              <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.urgent ? "bg-red-500 animate-ping" : "bg-neutral-500"}`} />
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-[11px] text-white font-bold leading-relaxed">{item.title}</p>
                <div className="flex gap-1.5 text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                  <span>{item.time}</span>
                  <span>•</span>
                  <span>{item.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
