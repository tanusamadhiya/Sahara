import { useState, useEffect } from "react";
import { ShieldCheck, Truck, Users, Activity, FileCheck, Phone, CheckSquare } from "lucide-react";
import { SOSRequest } from "../types";

export default function ResponderDashboard() {
  const [sosAlerts, setSosAlerts] = useState<SOSRequest[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sahara_sos_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSosAlerts(parsed);
          return;
        }
      }
    } catch (e) {}

    // Fallback demo data with clear Demo labels
    setSosAlerts([
      {
        id: "SOS-902 [Demo]",
        userPhone: "+91 98123 45680",
        userName: "Emergency Contact [Demo]",
        userLocation: { lat: 19.0810, lng: 72.8830, address: "Suburban High Street, Sector 3" },
        type: "medical",
        status: "en_route",
        responderName: "Medical Response Unit 402",
        responderVehicle: "Ambulance 402",
        responderLat: 19.0830,
        responderLng: 72.8800,
        eta: 4,
        distance: 1.2,
        timestamp: "12:14:02 UTC",
        blockchainTxId: "0x7d6f5a31b98f24419ad21b..."
      },
      {
        id: "SOS-104 [Demo]",
        userPhone: "+91 99341 23412",
        userName: "Rural Citizen [Demo]",
        userLocation: { lat: 19.0740, lng: 72.8710, address: "Farmer Co-op Shed, Sector 4" },
        type: "farmer",
        status: "sent",
        responderName: "Unassigned",
        responderVehicle: "None",
        responderLat: 0,
        responderLng: 0,
        eta: 0,
        distance: 0,
        timestamp: "12:20:45 UTC"
      }
    ]);
  }, []);

  const [activeFeedsLog, setActiveFeedsLog] = useState<string[]>([
    "[12:14:02] SOS Emergency alert initialized for Rajesh (Father). Reason: medical.",
    "[12:15:10] Officer Jenkins (Ambulance 402) accepted dispatch SOS-902.",
    "[12:15:15] Immutable block receipt created on blockchain. Block #18471142",
    "[12:20:45] Alert registered from Farmer Co-op: Sunita Verma reports snake bite."
  ]);

  const handleDispatch = (alertId: string, responderName: string, vehicle: string) => {
    setSosAlerts(prev => 
      prev.map(a => {
        if (a.id === alertId) {
          return {
            ...a,
            status: "accepted",
            responderName: responderName,
            responderVehicle: vehicle,
            eta: 8,
            distance: 3.4
          };
        }
        return a;
      })
    );

    setActiveFeedsLog(prev => [
      `[Just Now] Dispatch authorized. Assigned ${responderName} (${vehicle}) to alert ${alertId}.`,
      ...prev
    ]);
  };

  const handleResolveAlert = (alertId: string) => {
    setSosAlerts(prev => prev.filter(a => a.id !== alertId));
    setActiveFeedsLog(prev => [
      `[Just Now] Alert ${alertId} resolved. Responder confirmed patient status is SAFE and stable.`,
      ...prev
    ]);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto px-4 py-4 select-none animate-fade-in">
      
      {/* Overview Grid Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest block font-bold">Unresolved alarms</span>
            <span className="text-xl font-extrabold font-mono text-red-600">{sosAlerts.filter(a => a.status !== "arrived").length} Active</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">🚨</div>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest block font-bold">Responders en route</span>
            <span className="text-xl font-extrabold font-mono text-neutral-800">
              {sosAlerts.filter(a => a.status === "en_route" || a.status === "accepted").length} deployed
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">🚑</div>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest block font-bold">Ready Volunteer Core</span>
            <span className="text-xl font-extrabold font-mono text-neutral-800">42 Deployed</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">🛡️</div>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest block font-bold">Blockchain Status</span>
            <span className="text-xl font-extrabold text-emerald-500 font-sans flex items-center gap-1">
              <span>Stable</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
        </div>
      </section>

      {/* Active Alerts dispatch ledger */}
      <section className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="font-sans text-sm font-bold text-neutral-800 flex items-center gap-2">
          <Truck className="w-4 h-4 text-neutral-700" />
          Central Inbound SOS Alerts Queue
        </h3>

        <div className="space-y-4">
          {sosAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                alert.status === "sent" 
                  ? "border-red-200 bg-red-50/10 shadow-sm animate-pulse-soft" 
                  : "border-black/5 bg-neutral-50/50"
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-red-600 uppercase tracking-wider">{alert.id}</span>
                  <span className="text-sm font-bold text-neutral-800">{alert.userName}</span>
                  <span className="font-mono text-[8px] bg-neutral-100 text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded font-bold uppercase">
                    {alert.type}
                  </span>
                  <span className="font-mono text-[8px] text-neutral-400">Time: {alert.timestamp}</span>
                </div>
                
                <p className="text-xs text-neutral-600 font-semibold leading-relaxed">
                  <b>Location:</b> {alert.userLocation.address} (Lat: {alert.userLocation.lat.toFixed(4)}, Lng: {alert.userLocation.lng.toFixed(4)})
                </p>

                {alert.responderName !== "Unassigned" ? (
                  <div className="pt-2 flex items-center gap-4 text-[10px] text-neutral-400 font-semibold font-mono">
                    <span>RESPONDER: <b className="text-neutral-700">{alert.responderName} ({alert.responderVehicle})</b></span>
                    <span>DISTANCE: <b className="text-neutral-700">{alert.distance} km</b></span>
                    <span>ETA: <b className="text-red-600 font-bold">{alert.eta} mins</b></span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold font-mono text-red-500 block pt-1.5">
                    ⚠️ CRITICAL SHORTAGE - NO RESPONDER DEPLOYED
                  </span>
                )}
              </div>

              {/* Actions dispatch authorization */}
              <div className="flex gap-2 shrink-0 self-end md:self-center">
                {alert.responderName === "Unassigned" ? (
                  <>
                    <button
                      onClick={() => handleDispatch(alert.id, "Dr. Sanjay Roy", "Emergency Trauma Van")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Dispatch Medic Unit
                    </button>
                    <button
                      onClick={() => handleDispatch(alert.id, "Officer Patil", "Suburban Police Cruiser")}
                      className="px-4 py-2 bg-black hover:bg-neutral-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Dispatch Police
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}

          {sosAlerts.length === 0 && (
            <div className="text-center py-10 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl space-y-1">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-neutral-500">All alarms are verified safe.</p>
              <p className="text-[10px] text-neutral-400 font-semibold">Active monitor is watching live nodes.</p>
            </div>
          )}
        </div>
      </section>

      {/* Live active operations feed logs */}
      <section className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="font-sans text-sm font-bold text-neutral-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-neutral-700" />
          Live Active Operations System Logs
        </h3>

        <div className="bg-neutral-950 p-4 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto border border-white/5">
          {activeFeedsLog.map((log, i) => (
            <div key={i} className="line-clamp-2">
              <span className="text-neutral-500">SYSTEM:</span> {log}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
