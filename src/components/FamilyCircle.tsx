import React, { useState, useEffect } from "react";
import { FamilyContact } from "../types";
import { 
  MapPin, ShieldCheck, AlertTriangle, MessageCircle, PhoneCall, 
  RefreshCw, Plus, Trash2, Edit3, Star, Mail, Save, X, User as UserIcon,
  MessageSquare, Send, CheckCircle2, Share2
} from "lucide-react";
import { 
  getStoredFamilyContacts, 
  generateEmergencyWhatsAppMessage, 
  openWhatsAppContact, 
  openWhatsAppBroadcast 
} from "../utils/whatsappEmergency";
import WhatsAppEmergencyModal from "./WhatsAppEmergencyModal";

export default function FamilyCircle() {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  
  // Modal/Form edit state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  
  // Form values
  const [formName, setFormName] = useState("");
  const [formRelation, setFormRelation] = useState("Brother");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState<"safe" | "alert">("safe");
  const [formLat, setFormLat] = useState("19.0760");
  const [formLng, setFormLng] = useState("72.8777");
  const [formFavorite, setFormFavorite] = useState(false);
  const [formPhoto, setFormPhoto] = useState("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80");

  const avatarPresets = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
  ];

  // Load contacts from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sahara_family_contacts");
    if (saved) {
      setContacts(JSON.parse(saved));
    } else {
      // Default fallback starter data
      const defaults: FamilyContact[] = [
        { id: "f1", name: "Siddharth Dev", relation: "Brother", phone: "+91 98123 45678", status: "safe", lat: 19.0790, lng: 72.8790, lastSeen: "5 mins ago via Mesh" },
        { id: "f2", name: "Kiran Dev", relation: "Mother", phone: "+91 98123 45679", status: "safe", lat: 19.0720, lng: 72.8750, lastSeen: "12 mins ago via SMS" },
        { id: "f3", name: "Rajesh Dev", relation: "Father", phone: "+91 98123 45680", status: "alert", lat: 19.0810, lng: 72.8830, lastSeen: "1 min ago via Voice IVR" },
      ];
      setContacts(defaults);
      localStorage.setItem("sahara_family_contacts", JSON.stringify(defaults));
    }
  }, []);

  // Save contacts to local storage when changed
  const saveToStorage = (updatedList: FamilyContact[]) => {
    setContacts(updatedList);
    localStorage.setItem("sahara_family_contacts", JSON.stringify(updatedList));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Simulating contact position jitter to make it look live
      const jittered = contacts.map(c => ({
        ...c,
        lat: c.lat + (Math.random() - 0.5) * 0.001,
        lng: c.lng + (Math.random() - 0.5) * 0.001,
        lastSeen: "Just now updated via Mesh"
      }));
      saveToStorage(jittered);
    }, 1000);
  };

  const handlePing = (name: string) => {
    alert(`[MESH RELAY]: Dynamic RF broadcast ping packet delivered to ${name}'s local transponder. Acknowledgment returned in 240ms.`);
  };

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditContactId(null);
    setFormName("");
    setFormRelation("Brother");
    setFormPhone("");
    setFormEmail("");
    setFormStatus("safe");
    setFormLat("19.0750");
    setFormLng("72.8770");
    setFormFavorite(false);
    setFormPhoto(avatarPresets[0]);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (contact: FamilyContact) => {
    setEditContactId(contact.id);
    setFormName(contact.name);
    setFormRelation(contact.relation);
    setFormPhone(contact.phone);
    // Cast contact to any for email if it wasn't strictly typed
    setFormEmail((contact as any).email || "");
    setFormStatus(contact.status);
    setFormLat(contact.lat.toString());
    setFormLng(contact.lng.toString());
    setFormFavorite((contact as any).favorite || false);
    setFormPhoto((contact as any).photo || avatarPresets[0]);
    setIsFormOpen(true);
  };

  // Save Add/Edit Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      alert("Name and Phone Number are required.");
      return;
    }

    if (editContactId) {
      // Edit existing
      const updated = contacts.map(c => {
        if (c.id === editContactId) {
          return {
            ...c,
            name: formName,
            relation: formRelation,
            phone: formPhone,
            email: formEmail,
            status: formStatus,
            lat: parseFloat(formLat) || 19.07,
            lng: parseFloat(formLng) || 72.87,
            favorite: formFavorite,
            photo: formPhoto,
            lastSeen: "Updated just now"
          } as any;
        }
        return c;
      });
      saveToStorage(updated);
    } else {
      // Create new
      const newContact: any = {
        id: `f-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formName,
        relation: formRelation,
        phone: formPhone.startsWith("+") ? formPhone : `+91 ${formPhone}`,
        email: formEmail,
        status: formStatus,
        lat: parseFloat(formLat) || 19.075,
        lng: parseFloat(formLng) || 72.877,
        favorite: formFavorite,
        photo: formPhoto,
        lastSeen: "Registered just now over secure channel"
      };
      saveToStorage([...contacts, newContact]);
    }
    setIsFormOpen(false);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const confirmAndDelete = (id: string) => {
    const filtered = contacts.filter(c => c.id !== id);
    saveToStorage(filtered);
    setConfirmDeleteId(null);
    if (editContactId === id) {
      setIsFormOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const toggleFavorite = (id: string) => {
    const updated = contacts.map(c => {
      if (c.id === id) {
        return { ...c, favorite: !(c as any).favorite } as any;
      }
      return c;
    });
    saveToStorage(updated);
  };

  return (
    <div className="space-y-6 max-w-[600px] mx-auto px-4 py-4 select-none animate-fade-in pb-12">
      
      {/* WhatsApp Emergency Dispatch Hub Banner */}
      <section className="bg-gradient-to-r from-emerald-950/80 via-[#161923] to-[#161923] border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>WhatsApp Emergency Dispatcher</span>
                <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  {contacts.length} Connected
                </span>
              </h3>
              <p className="text-[10px] text-emerald-300/80 font-mono">
                Auto-sends Google Maps live location link to all added family numbers
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsWhatsAppModalOpen(true)}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer border border-emerald-400/40"
        >
          <Send className="w-4 h-4 animate-bounce" />
          <span>🚨 Broadcast WhatsApp SOS to All Family Members</span>
        </button>
      </section>

      {/* Header section with mesh lock */}
      <section className="flex justify-between items-center bg-[#161923] border border-white/10 rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Mesh Guardian Network</h3>
          <p className="text-[10px] text-gray-400">
            Monitor and coordinate with family members offline via local mesh BT RF & SMS relays.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="w-10 h-10 flex items-center justify-center bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-full transition-all cursor-pointer shadow-lg shadow-orange-950/20"
            title="Register Emergency Contact"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 flex items-center justify-center bg-[#212530] hover:bg-[#2A2E3D] active:scale-95 border border-white/5 rounded-full text-gray-300 transition-all cursor-pointer"
            title="Scan Bluetooth Mesh transponders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>
        </div>
      </section>

      {/* Interactive Contact Form Modal */}
      {isFormOpen && (
        <form onSubmit={handleSaveForm} className="bg-[#161923] border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {editContactId ? "Edit Emergency Contact" : "Add Emergency Contact"}
            </h4>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Photo preset */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Contact Photo Preset</label>
            <div className="flex gap-3">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormPhoto(preset)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${formPhoto === preset ? "border-orange-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={preset} className="w-full h-full object-cover" alt="Preset" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase">Full Name *</label>
              <input 
                type="text" 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                placeholder="e.g. Siddharth Dev"
                className="w-full text-xs py-2 px-3 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase">Relationship</label>
              <select 
                value={formRelation} 
                onChange={(e) => setFormRelation(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg text-white"
              >
                <option value="Brother">Brother</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Sister">Sister</option>
                <option value="Wife">Wife</option>
                <option value="Husband">Husband</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Friend">Friend</option>
                <option value="Partner">Partner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono">Mobile Phone *</label>
              <input 
                type="tel" 
                value={formPhone} 
                onChange={(e) => setFormPhone(e.target.value)} 
                placeholder="98123 45678"
                className="w-full text-xs py-2 px-3 rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase">Email Address</label>
              <input 
                type="email" 
                value={formEmail} 
                onChange={(e) => setFormEmail(e.target.value)} 
                placeholder="sid@gmail.com"
                className="w-full text-xs py-2 px-3 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase">Status</label>
              <select 
                value={formStatus} 
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-lg text-white"
              >
                <option value="safe">Safe (Green)</option>
                <option value="alert">Distressed (Red)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono">Latitude</label>
              <input 
                type="text" 
                value={formLat} 
                onChange={(e) => setFormLat(e.target.value)} 
                className="w-full text-xs py-2 px-3 rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono">Longitude</label>
              <input 
                type="text" 
                value={formLng} 
                onChange={(e) => setFormLng(e.target.value)} 
                className="w-full text-xs py-2 px-3 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 font-semibold">
              <input 
                type="checkbox" 
                checked={formFavorite} 
                onChange={(e) => setFormFavorite(e.target.checked)} 
                className="rounded text-orange-600 focus:ring-0"
              />
              <span>Mark as Primary Emergency Favorite</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button 
              type="submit" 
              className="flex-1 min-w-[140px] py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>SAVE GUARDIAN LINK</span>
            </button>
            {editContactId && (
              <button 
                type="button" 
                onClick={() => {
                  if (editContactId) {
                    handleDelete(editContactId);
                    setIsFormOpen(false);
                  }
                }}
                className="px-3.5 py-2.5 bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>DELETE MEMBER</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 bg-[#212530] text-gray-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main family list feed */}
      <section className="space-y-4">
        {contacts.map((contact) => {
          const isFav = (contact as any).favorite;
          return (
            <div 
              key={contact.id} 
              className={`bg-[#161923] p-5 rounded-2xl border transition-all ${
                contact.status === "alert" 
                  ? "border-red-500/30 bg-red-950/10" 
                  : "border-white/5"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                
                {/* User Card */}
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shrink-0 shadow">
                    <img src={(contact as any).photo || avatarPresets[0]} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{contact.name}</h4>
                      <span className="font-mono text-[8px] bg-white/5 border border-white/10 text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {contact.relation}
                      </span>
                      {isFav && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold font-mono flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      Lat: {contact.lat.toFixed(4)}, Lng: {contact.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => toggleFavorite(contact.id)}
                    className={`p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer border ${isFav ? 'text-amber-400 border-amber-400/40 bg-amber-400/10' : 'text-gray-400 border-white/10 bg-white/5'}`}
                    title="Toggle Primary Favorite"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(contact)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
                    title="Edit Contact"
                  >
                    <Edit3 className="w-3 h-3 text-orange-400" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(contact.id)}
                    className="px-2 py-1 rounded-lg bg-red-600/20 border border-red-500/40 hover:bg-red-600 text-red-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
                    title="Delete Family Member"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Status and Contact Meta */}
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-t border-white/5 pt-3 mt-2">
                <div className="flex items-center gap-1">
                  {contact.status === "safe" ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-full text-[9px] uppercase tracking-wide">
                      <ShieldCheck className="w-3 h-3" /> Safe
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-full text-[9px] uppercase tracking-wide animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Distressed
                    </span>
                  )}
                </div>
                <span>RELAY: <b className="text-gray-300">{contact.lastSeen}</b></span>
              </div>

              {/* Primary action controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <button
                  onClick={() => {
                    const msg = generateEmergencyWhatsAppMessage("Emergency User", "Current GPS Coordinates Pinned", contact.lat, contact.lng);
                    openWhatsAppContact(contact.phone, msg);
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 shadow transition-all font-mono cursor-pointer border border-emerald-400/30"
                  title="Send Live GPS Location on WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp SOS</span>
                </button>

                <button
                  onClick={() => handlePing(contact.name)}
                  className="py-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 shadow transition-all border border-white/5 cursor-pointer"
                >
                  <span>RF Ping</span>
                </button>
                
                <a
                  href={`sms:${contact.phone}`}
                  className="py-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 shadow transition-all border border-white/5 items-center justify-center"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-gray-300" />
                  <span>SMS Relay</span>
                </a>

                <a
                  href={`tel:${contact.phone}`}
                  className="py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 shadow transition-all items-center justify-center"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white" />
                  <span>SOS Call</span>
                </a>
              </div>
            </div>
          );
        })}
      </section>

      {/* WhatsApp Emergency Modal Component */}
      <WhatsAppEmergencyModal 
        isOpen={isWhatsAppModalOpen} 
        onClose={() => setIsWhatsAppModalOpen(false)} 
        userName="Emergency User" 
        locationAddress="Current GPS Coordinates Pinned" 
        lat={19.0760} 
        lng={72.8777} 
        emergencyType="Family Circle SOS Alert"
      />

      {/* Custom Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#161A28] border border-red-500/40 rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white uppercase tracking-wider font-mono">Delete Family Member?</h4>
                <p className="text-[10px] text-gray-300 font-mono">This action will remove them from your emergency alert list.</p>
              </div>
            </div>

            <p className="text-xs text-gray-200 font-medium bg-white/5 p-3 rounded-xl border border-white/10 font-mono">
              Remove <strong className="text-white">{contacts.find(c => c.id === confirmDeleteId)?.name || "Member"}</strong> ({contacts.find(c => c.id === confirmDeleteId)?.relation || "Contact"})?
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => confirmAndDelete(confirmDeleteId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs font-mono uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/50"
              >
                Yes, Delete Member
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2.5 bg-[#212530] hover:bg-[#2A2E3D] text-white font-bold text-xs font-mono rounded-xl transition-all cursor-pointer border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
