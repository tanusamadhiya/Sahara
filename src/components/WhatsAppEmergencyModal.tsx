import React, { useState } from "react";
import { MessageSquare, MapPin, Send, CheckCircle2, ShieldAlert, X, ExternalLink, Users, AlertTriangle } from "lucide-react";
import { FamilyContact } from "../types";
import { 
  getStoredFamilyContacts, 
  getSampleFamilyContacts,
  generateEmergencyWhatsAppMessage, 
  getWhatsAppDirectUrl, 
  getWhatsAppBroadcastUrl,
  openWhatsAppContact,
  openWhatsAppBroadcast
} from "../utils/whatsappEmergency";

interface WhatsAppEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  locationAddress: string;
  lat: number;
  lng: number;
  emergencyType?: string;
}

export default function WhatsAppEmergencyModal({
  isOpen,
  onClose,
  userName,
  locationAddress,
  lat,
  lng,
  emergencyType = "Critical Emergency / SOS"
}: WhatsAppEmergencyModalProps) {
  const [contacts] = useState<FamilyContact[]>(() => {
    const stored = getStoredFamilyContacts();
    return stored.length > 0 ? stored : getSampleFamilyContacts();
  });
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  const message = generateEmergencyWhatsAppMessage(
    userName,
    locationAddress,
    lat,
    lng,
    emergencyType
  );

  if (!isOpen) return null;

  const handleSendIndividual = (contact: FamilyContact) => {
    openWhatsAppContact(contact.phone, message);
    setSentMap(prev => ({ ...prev, [contact.id]: true }));
  };

  const handleSendAllBroadcast = () => {
    openWhatsAppBroadcast(message);
    setBroadcastSent(true);
    // Mark all as sent in preview
    const updated: Record<string, boolean> = {};
    contacts.forEach(c => {
      updated[c.id] = true;
    });
    setSentMap(updated);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#141828] border border-emerald-500/40 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>WhatsApp Emergency Dispatcher</span>
              </h3>
              <p className="text-[10px] text-emerald-300 font-mono font-medium">
                Auto-sending live Google Maps location to all added family numbers
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Urgent Emergency Alert Banner */}
        <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl flex items-center gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
          <div className="text-xs">
            <p className="font-black text-white uppercase tracking-wide">Emergency SOS Fired!</p>
            <p className="text-[10px] text-red-200 font-mono font-semibold">
              Live GPS Coordinates: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E ({locationAddress})
            </p>
          </div>
        </div>

        {/* Auto Dispatch Status Indicator */}
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 shadow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-emerald-200 font-mono">
              Auto-WhatsApp Message Shared to Family Number
            </span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40 uppercase shrink-0">
            DISPATCHED
          </span>
        </div>

        {/* WhatsApp Broadcast Master Action */}
        <div className="space-y-2">
          <button
            onClick={handleSendAllBroadcast}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer border border-emerald-400/40"
          >
            <Send className="w-4 h-4" />
            <span>🚨 Broadcast WhatsApp Message to All Family Members</span>
          </button>
          {broadcastSent && (
            <p className="text-[10px] text-center text-emerald-300 font-mono font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Broadcast Launched Successfully!
            </p>
          )}
        </div>

        {/* Family Member Individual Dispatch List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px] font-mono text-white">
            <span className="uppercase text-white font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Family Contacts ({contacts.length})
            </span>
            <span className="text-[10px] text-emerald-300 font-bold">1-Tap WhatsApp Resend</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {contacts.map((contact) => {
              const isSent = sentMap[contact.id];
              return (
                <div 
                  key={contact.id} 
                  className="bg-[#0D0F1B] border border-white/10 hover:border-emerald-500/30 rounded-xl p-3 flex justify-between items-center transition-all shadow"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-white">{contact.name}</span>
                      <span className="text-[9px] bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.2 rounded text-orange-300 font-mono font-bold">
                        {contact.relation}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-200 font-mono font-bold">{contact.phone}</p>
                  </div>

                  <button
                    onClick={() => handleSendIndividual(contact)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSent 
                        ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md border border-emerald-400/40"
                    }`}
                  >
                    {isSent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Auto-Sent</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Resend WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location & Message Preview Box */}
        <div className="bg-[#0A0B10] border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-white">
            <span className="uppercase text-amber-300 font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-400" /> Live WhatsApp Emergency Text
            </span>
            <span className="text-emerald-400 font-bold">Google Maps GPS Link Included</span>
          </div>
          <div className="text-[10px] text-white font-mono bg-white/5 p-2.5 rounded-lg whitespace-pre-line border border-white/10 select-all overflow-x-auto max-h-[100px] leading-relaxed">
            {message}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#212530] hover:bg-[#2A2E3D] text-white text-xs font-black font-mono rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
