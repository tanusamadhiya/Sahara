import { useState } from "react";
import { UserProfile } from "../types";
import { 
  ShieldAlert, Heart, Calendar, CreditCard, 
  CheckCircle2, Edit2, Check, Download, Share2, Plus, Trash, User as UserIcon,
  MapPin, Clipboard, ShieldCheck, Globe, Award, Trophy, FileText, HeartPulse
} from "lucide-react";

const healthIllustration = new URL("../assets/health-profile-art.svg", import.meta.url).href;

interface HealthIdScreenProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
}

export default function HealthIdScreen({ user, onUpdateUser, onLogout }: HealthIdScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Form Editing state values
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age?.toString() || "28");
  const [gender, setGender] = useState(user.gender || "Male");
  const [bloodType, setBloodType] = useState(user.bloodType);
  const [phone, setPhone] = useState(user.phone);
  const [healthId, setHealthId] = useState(user.healthId);
  const [insuranceProvider, setInsuranceProvider] = useState(user.insuranceProvider);
  const [policyNumber, setPolicyNumber] = useState(user.policyNumber);
  const [address, setAddress] = useState(user.address || "Sector 4, Bandra West, Mumbai, Maharashtra 400050");
  const [emergencyNotes, setEmergencyNotes] = useState(user.healthNotes || "Patient is a daily active runner. Please bypass Atenolol if heart rate is under 55 BPM.");
  const [district, setDistrict] = useState(user.district || user.city || "Mumbai Suburban");
  const [village, setVillage] = useState(user.village || "Bandra");
  const [disabilities, setDisabilities] = useState<string[]>(user.disabilities || ["None"]);
  const [newDisability, setNewDisability] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState(user.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user.emergencyContactPhone);

  // Lists state
  const [allergies, setAllergies] = useState<string[]>(user.allergies);
  const [newAllergy, setNewAllergy] = useState("");
  const [medications, setMedications] = useState<string[]>(user.medications);
  const [newMedication, setNewMedication] = useState("");

  // Presets of avatars
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || avatarPresets[0]);

  // Handle Save
  const handleSaveProfile = () => {
    // Calculate dynamic safety score based on completeness of card/profile data
    let score = 20; // base score
    if (healthId && healthId !== "None" && healthId.trim().length > 4) score += 15;
    if (phone && phone.trim().length > 4) score += 15;
    if (bloodType && bloodType !== "None") score += 10;
    if (emergencyContactName && emergencyContactPhone) score += 20;
    if (address && address.trim().length > 10) score += 10;
    if (district || village) score += 5;
    if (allergies.length > 0 || medications.length > 0) score += 10;
    if (policyNumber && policyNumber !== "None") score += 5;
    const computedSafetyScore = Math.min(score, 100);

    const updated: UserProfile = {
      ...user,
      name,
      bloodType,
      phone,
      healthId,
      insuranceProvider,
      policyNumber,
      allergies,
      medications,
      avatar: selectedAvatar,
      language: user.language,
      gender,
      age: parseInt(age) || 28,
      address,
      district,
      village,
      disabilities,
      emergencyContactName,
      emergencyContactPhone,
      healthNotes: emergencyNotes,
      safetyScore: computedSafetyScore
    };
    onUpdateUser(updated);
    setIsEditing(false);
  };

  // Handle Add/Remove Lists
  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Download Card
  const handleDownloadCard = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Create text report for direct file download
      const reportContent = `SAHARA HEALTH OS CARD REPORT
==================================
PATIENT ID: ${user.id}
HEALTH ID: ${healthId}
FULL NAME: ${name}
AGE / GENDER: ${age} / ${gender}
BLOOD GROUP: ${bloodType}
BASE PHONE: ${phone}
EMERGENCY CONTACT: ${user.emergencyContactName} (${user.emergencyContactPhone})
ADDRESS: ${address}
----------------------------------
ALLERGIES: ${allergies.join(", ") || "None"}
MEDICATIONS: ${medications.join(", ") || "None"}
INSURANCE: ${insuranceProvider} (#${policyNumber})
EMERGENCY NOTES: ${emergencyNotes}
==================================
PROFILE STATUS: READY FOR EMERGENCY USE`;

      const blob = new Blob([reportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SAHARA_EmergencyCard_${name.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  // Share Card
  const handleShareCard = () => {
    const payload = `SAHARA Emergency Health ID: ${name} (${bloodType}). Health ID: ${healthId}. Primary allergies: ${allergies.join(", ") || "None"}.`;
    if (navigator.share) {
      navigator.share({
        title: "SAHARA Digital Health ID",
        text: payload,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(payload);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Generate dynamic QR code data payload
  const qrData = encodeURIComponent(`SAHARA_ID=${user.id}&NAME=${name}&BLOOD=${bloodType}&ALLERGIES=${allergies.join(",")}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  return (
    <div className="health-id-page select-none animate-fade-in pb-12">
      <section className="health-id-hero">
        <div className="health-id-hero-copy">
          <span className="health-id-eyebrow"><ShieldCheck /> READY WHEN IT MATTERS</span>
          <h2>Your essential health details,<br /><span>ready for the right people.</span></h2>
          <p>Keep emergency contacts and medical information clear, current, and easy to share when help is needed.</p>
          <div className="health-id-hero-chips"><span>Private by design</span><span>Emergency-ready</span></div>
        </div>
        <div className="health-id-hero-art">
          <img src={healthIllustration} alt="A community health responder helping a neighbor" />
          <span className="health-id-art-tag"><HeartPulse /> Health profile</span>
        </div>
      </section>
      <div className="health-id-layout">
      {/* DIGITAL SAFETY VAULT MAIN HEADER */}
      <div className="health-id-toolbar bg-[#161A28] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Digital Safety Vault</h3>
              <span className="text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                ENCRYPTED
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Encrypted Health ID & Emergency Directives</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <span>LOGOUT</span>
            </button>
          )}
          <button
            onClick={() => {
              if (isEditing) handleSaveProfile();
              else setIsEditing(true);
            }}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>SAVE PROFILE</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>EDIT CARD</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Digital Health ID Card Graphic */}
      <section className="health-id-card relative overflow-hidden bg-gradient-to-br from-[#101322] via-[#161B2E] to-[#101322] rounded-3xl p-5 text-white shadow-2xl border border-white/10 group">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]" />

        {/* Card Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
          <div className="space-y-0.5">
            <span className="font-mono text-[8px] tracking-widest font-bold text-orange-400 uppercase block">Sahara National Health OS</span>
            <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>Emergency Medical Health ID</span>
              <span className="font-mono text-[9px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {healthId}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 px-3 py-1 rounded-full text-xs font-black text-red-300 shadow">
            <Heart className="w-3.5 h-3.5 animate-pulse text-red-400 fill-red-400" />
            <span className="font-mono">{bloodType}</span>
          </div>
        </div>

        {/* Demographics & QR Code layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          
          {/* Patient Details Column */}
          <div className="sm:col-span-2 space-y-3">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500/60 shadow bg-white/5 shrink-0">
                <img className="w-full h-full object-cover" src={selectedAvatar} alt="Patient avatar" />
              </div>
              <div>
                <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block font-bold">PATIENT DEMOGRAPHICS</span>
                <span className="text-sm font-extrabold text-white block leading-tight">{name}</span>
                <span className="text-[10px] text-gray-300 font-medium">Age: {age} Yrs • Gender: {gender}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#0D0F1B]/60 p-2 rounded-xl border border-white/5">
                <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block font-bold">Primary Phone</span>
                <span className="font-mono text-xs font-bold text-orange-400 block mt-0.5">{phone}</span>
              </div>
              <div className="bg-[#0D0F1B]/60 p-2 rounded-xl border border-white/5">
                <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block font-bold">Guardian Contact</span>
                <span className="text-[10px] font-bold text-white block mt-0.5 truncate">
                  {emergencyContactName} ({emergencyContactPhone})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#0D0F1B]/60 p-2 rounded-xl border border-white/5">
                <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block font-bold">Location Base</span>
                <span className="text-[10px] font-bold text-gray-200 block mt-0.5 truncate">
                  {district} / {village}
                </span>
              </div>
              <div className="bg-[#0D0F1B]/60 p-2 rounded-xl border border-white/5">
                <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest block font-bold">Disabilities</span>
                <span className={`text-[10px] font-bold block mt-0.5 truncate ${disabilities.includes("None") || disabilities.length === 0 ? "text-gray-300" : "text-red-400"}`}>
                  {disabilities.join(", ") || "None"}
                </span>
              </div>
            </div>

          </div>

          {/* Interactive QR code Column */}
          <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 bg-[#0D0F1B]/80 border border-white/5 rounded-2xl">
            <div className="w-24 h-24 bg-white rounded-xl p-1.5 border border-white/10 shadow-lg relative group-hover:scale-105 transition-transform flex items-center justify-center">
              <img 
                alt="Digital QR" 
                className="w-full h-full object-contain" 
                src={qrUrl}
              />
            </div>
            <span className="font-mono text-[7px] text-gray-400 uppercase tracking-widest font-bold mt-2 text-center">
              Scan for Emergency Details
            </span>
          </div>
        </div>

        {/* Action Bar for Downloading / Sharing */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap justify-between items-center gap-2 text-[10px] text-gray-400 font-mono">
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadCard} 
              disabled={downloading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-colors cursor-pointer font-bold"
            >
              <Download className="w-3 h-3 text-orange-400" />
              <span>{downloading ? "DOWNLOADING..." : "DOWNLOAD CARD"}</span>
            </button>
            <button 
              onClick={handleShareCard}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-colors cursor-pointer font-bold"
            >
              <Share2 className="w-3 h-3 text-orange-400" />
              <span>{shareSuccess ? "COPIED DETAILS!" : "SHARE LINK"}</span>
            </button>
          </div>
          <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" /> PROFILE READY
          </span>
        </div>
      </section>

      {/* PROFILE EDIT WORKFLOW - Visible when isEditing is true */}
      {isEditing && (
        <section className="health-id-editor bg-[#161923] border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/5 pb-2">
            Modify Emergency Demographics
          </h3>

          {/* Avatar selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Select Secure Avatar Preset</label>
            <div className="flex gap-3">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(preset)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === preset ? "border-orange-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={preset} className="w-full h-full object-cover" alt="Preset" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Patient Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Primary Phone</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-mono py-2 px-3 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Age</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Blood Group</label>
              <select 
                value={bloodType} 
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase">Residential Address</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">District</label>
              <input 
                type="text" 
                value={district} 
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Village</label>
              <input 
                type="text" 
                value={village} 
                onChange={(e) => setVillage(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Guardian Emergency Contact Name</label>
              <input 
                type="text" 
                value={emergencyContactName} 
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Guardian Emergency Contact Phone</label>
              <input 
                type="text" 
                value={emergencyContactPhone} 
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Insurance Provider</label>
              <input 
                type="text" 
                value={insuranceProvider} 
                onChange={(e) => setInsuranceProvider(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Policy Number</label>
              <input 
                type="text" 
                value={policyNumber} 
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Dynamic Disabilities Add/Remove */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase block">Disabilities & Special Conditions</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newDisability} 
                onChange={(e) => setNewDisability(e.target.value)}
                placeholder="Add e.g. Visually Impaired (or type 'None')"
                className="flex-1 text-xs py-2 px-3 rounded-lg"
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    if (newDisability.trim()) {
                      const filtered = disabilities.filter(d => d !== "None");
                      setDisabilities([...filtered, newDisability.trim()]);
                      setNewDisability("");
                    }
                  } 
                }}
              />
              <button 
                type="button" 
                onClick={() => {
                  if (newDisability.trim()) {
                    const filtered = disabilities.filter(d => d !== "None");
                    setDisabilities([...filtered, newDisability.trim()]);
                    setNewDisability("");
                  }
                }}
                className="px-3 bg-orange-600 rounded-lg text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {disabilities.map((d, i) => (
                <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                  <span>{d}</span>
                  <button type="button" onClick={() => {
                    const remaining = disabilities.filter((_, idx) => idx !== i);
                    setDisabilities(remaining.length === 0 ? ["None"] : remaining);
                  }}>
                    <Trash className="w-2.5 h-2.5 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic Allergies Add/Remove */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase block">Allergies & Contraindications</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newAllergy} 
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add e.g. Peanuts"
                className="flex-1 text-xs py-2 px-3 rounded-lg"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
              />
              <button 
                type="button" 
                onClick={addAllergy}
                className="px-3 bg-orange-600 rounded-lg text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allergies.map((a, i) => (
                <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                  <span>{a}</span>
                  <button type="button" onClick={() => removeAllergy(i)}>
                    <Trash className="w-2.5 h-2.5 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic Medications Add/Remove */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase block">Daily Medical Prescriptions</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newMedication} 
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add e.g. Metformin 500mg"
                className="flex-1 text-xs py-2 px-3 rounded-lg"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMedication(); } }}
              />
              <button 
                type="button" 
                onClick={addMedication}
                className="px-3 bg-orange-600 rounded-lg text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {medications.map((m, i) => (
                <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                  <span>{m}</span>
                  <button type="button" onClick={() => removeMedication(i)}>
                    <Trash className="w-2.5 h-2.5 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase block">First Responder Instructions & Notes</label>
            <textarea 
              value={emergencyNotes} 
              onChange={(e) => setEmergencyNotes(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white h-16 resize-none"
            />
          </div>

          <button 
            type="button"
            onClick={handleSaveProfile}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 font-bold text-xs text-white rounded-xl shadow-lg transition-colors uppercase tracking-widest cursor-pointer"
          >
            Encrypt & Write to Digital Vault
          </button>
        </section>
      )}

      {/* Critical Medical Directives Card summary */}
      <section className="health-id-parameters bg-[#161923] border border-white/10 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
          <ShieldAlert className="w-4 h-4 text-orange-500" />
          Active Emergency Medical Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#0F111A] rounded-xl p-3 border border-white/5 space-y-1.5">
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block font-bold">Allergies & Contra</span>
            <ul className="space-y-1">
              {allergies.length > 0 ? allergies.map((a, i) => (
                <li key={i} className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {a}
                </li>
              )) : (
                <li className="text-xs text-gray-500 italic">No allergies recorded</li>
              )}
            </ul>
          </div>

          <div className="bg-[#0F111A] rounded-xl p-3 border border-white/5 space-y-1.5">
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block font-bold">Active Medications</span>
            <ul className="space-y-1">
              {medications.length > 0 ? medications.map((m, i) => (
                <li key={i} className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {m}
                </li>
              )) : (
                <li className="text-xs text-gray-500 italic">No prescriptions logged</li>
              )}
            </ul>
          </div>

          <div className="bg-[#0F111A] rounded-xl p-3 border border-white/5 space-y-2 col-span-1 sm:col-span-2">
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block font-bold">Insurance & Notes directives</span>
            <div className="flex justify-between text-xs text-white font-semibold border-b border-white/5 pb-1">
              <span>{insuranceProvider}</span>
              <span className="font-mono text-orange-400">{policyNumber}</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed italic">{emergencyNotes}</p>
          </div>
        </div>
      </section>

      {/* COMMUNITY IMPACT & RECOGNITION SECTION FOR USER PROFILE */}
      <section className="health-id-community bg-[#161923] border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
            <Award className="w-4 h-4 text-emerald-400" />
            Decentralized Community Impact
          </h3>
          <span className="font-mono text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold">
            #3 Village Rank
          </span>
        </div>

        {/* Dynamic score summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0F111A] border border-white/5 rounded-xl p-3 text-center space-y-0.5">
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block font-bold">REPUTATION SCORE</span>
            <span className="text-base font-extrabold text-white font-mono">780 pts</span>
          </div>
          <div className="bg-[#0F111A] border border-white/5 rounded-xl p-3 text-center space-y-0.5">
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block font-bold">LIVES INFLUENCED</span>
            <span className="text-base font-extrabold text-red-400 font-mono">14 Lives</span>
          </div>
        </div>

        {/* Detailed stats grids */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0F111A]/60 border border-white/5 p-2 rounded-lg space-y-0.5">
            <span className="font-mono text-[7px] text-gray-500 block uppercase font-bold">VOLUNTEER HOURS</span>
            <span className="text-xs font-bold text-gray-200">42 hrs</span>
          </div>
          <div className="bg-[#0F111A]/60 border border-white/5 p-2 rounded-lg space-y-0.5">
            <span className="font-mono text-[7px] text-gray-500 block uppercase font-bold">BLOOD DONATED</span>
            <span className="text-xs font-bold text-gray-200">4 Units</span>
          </div>
          <div className="bg-[#0F111A]/60 border border-white/5 p-2 rounded-lg space-y-0.5">
            <span className="font-mono text-[7px] text-gray-500 block uppercase font-bold">CERTIFICATES</span>
            <span className="text-xs font-bold text-yellow-500">3 Earned</span>
          </div>
        </div>

        {/* Ranks geographical tiers */}
        <div className="bg-[#0F111A] border border-white/5 p-3 rounded-xl">
          <span className="font-mono text-[8px] text-gray-500 uppercase block font-bold mb-1.5">Geographical Citizen Ranks</span>
          <div className="flex justify-between text-[10px] text-gray-300 font-bold font-mono">
            <span className="flex items-center gap-1">📍 Village: <b className="text-white">#3</b></span>
            <span className="flex items-center gap-1">📍 District: <b className="text-white">#28</b></span>
            <span className="flex items-center gap-1">📍 State: <b className="text-white">#145</b></span>
          </div>
        </div>

        {/* Badge Showcase list */}
        <div className="space-y-2">
          <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block font-bold">Earned Achievement Badges</span>
          
          <div className="grid grid-cols-2 gap-2">
            
            <div className="bg-[#0F111A]/50 border border-amber-500/15 p-2 rounded-xl flex items-center gap-2">
              <span className="text-xl">🥇</span>
              <div>
                <span className="text-[10px] font-black text-white block leading-tight">Gold Volunteer</span>
                <span className="font-mono text-[7.5px] text-amber-500">Verified Badge</span>
              </div>
            </div>

            <div className="bg-[#0F111A]/50 border border-red-500/15 p-2 rounded-xl flex items-center gap-2">
              <span className="text-xl">❤️</span>
              <div>
                <span className="text-[10px] font-black text-white block leading-tight">Hero Blood Donor</span>
                <span className="font-mono text-[7.5px] text-red-400">Verified Badge</span>
              </div>
            </div>

            <div className="bg-[#0F111A]/50 border border-orange-500/15 p-2 rounded-xl flex items-center gap-2">
              <span className="text-xl">🚑</span>
              <div>
                <span className="text-[10px] font-black text-white block leading-tight">Emergency Hero</span>
                <span className="font-mono text-[7.5px] text-orange-400">Verified Badge</span>
              </div>
            </div>

            <div className="bg-[#0F111A]/50 border border-emerald-500/15 p-2 rounded-xl flex items-center gap-2">
              <span className="text-xl">👨‍🌾</span>
              <div>
                <span className="text-[10px] font-black text-white block leading-tight">Village Guardian</span>
                <span className="font-mono text-[7.5px] text-emerald-400">Verified Badge</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Accessibility Preferences Card */}
      <section className="health-id-accessibility bg-[#161923] border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
            <Globe className="w-4 h-4 text-orange-500" />
            Accessibility & Display Settings
          </h3>
          <span className="font-mono text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
            ADAPTIVE INTERFACE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Font Scale */}
          <div className="bg-[#0F111A] border border-white/5 p-3 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">Font Size Scale</span>
            <div className="flex items-center gap-2">
              {["Normal", "Large", "XL"].map((scale) => (
                <button
                  key={scale}
                  onClick={() => {
                    const updated = { ...user, fontSizeScale: scale.toLowerCase() };
                    onUpdateUser(updated);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    (user as any).fontSizeScale === scale.toLowerCase() || (scale === "Normal" && !(user as any).fontSizeScale)
                      ? "bg-orange-600 text-white shadow-md shadow-orange-950/40"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="bg-[#0F111A] border border-white/5 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">High Contrast Mode</span>
              <span className="text-xs font-medium text-gray-300">Sharpen text & icons</span>
            </div>
            <button
              onClick={() => {
                const updated = { ...user, highContrast: !(user as any).highContrast };
                onUpdateUser(updated);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                (user as any).highContrast ? "bg-orange-600" : "bg-white/10"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  (user as any).highContrast ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Voice Assistance */}
          <div className="bg-[#0F111A] border border-white/5 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block font-bold">Voice Guidance</span>
              <span className="text-xs font-medium text-gray-300">Spoken emergency updates</span>
            </div>
            <button
              onClick={() => {
                const updated = { ...user, voiceGuidance: !(user as any).voiceGuidance };
                onUpdateUser(updated);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                (user as any).voiceGuidance !== false ? "bg-emerald-600" : "bg-white/10"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  (user as any).voiceGuidance !== false ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
}
