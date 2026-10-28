import React, { useState } from "react";
import { Volunteer, BloodDonor } from "../types";
import { 
  Users, HeartHandshake, Search, Check, ShieldAlert, Award, 
  ArrowUpRight, Briefcase, Wrench, Truck, AlertTriangle, Phone, 
  CheckCircle2, Plus, ShieldCheck, Landmark, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../utils/i18n";

export default function VolunteerBloodScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"blood" | "volunteer" | "providers">("blood");
  const [selectedBloodType, setSelectedBloodType] = useState<string>("O+");
  
  // Blood donor registry data
  const [donors, setDonors] = useState<BloodDonor[]>([
    { id: "1", name: "Rohan Sharma", bloodType: "O+", phone: "+91 98765 11111", distance: 0.8, status: "available", lastDonated: "3 months ago" },
    { id: "2", name: "Preeti Patil", bloodType: "A-", phone: "+91 98765 22222", distance: 1.5, status: "available", lastDonated: "5 months ago" },
    { id: "3", name: "Vikram Malhotra", bloodType: "O+", phone: "+91 98765 33333", distance: 2.1, status: "available", lastDonated: "2 months ago" },
    { id: "4", name: "Ananya Deshmukh", bloodType: "AB-", phone: "+91 98765 44444", distance: 3.4, status: "available", lastDonated: "6 months ago" },
    { id: "5", name: "Suresh Gupta", bloodType: "O-", phone: "+91 98765 55555", distance: 4.2, status: "available", lastDonated: "1 month ago" },
  ]);

  const [isRegisteredDonor, setIsRegisteredDonor] = useState<boolean>(false);
  const [volunteerStatus, setVolunteerStatus] = useState<boolean>(false);
  const [volunteerReputation, setVolunteerReputation] = useState<number>(340);
  const [tasksCompleted, setTasksCompleted] = useState<number>(12);

  // Volunteer available events
  const [matchingTasks, setMatchingTasks] = useState([
    { id: "v1", title: "Deliver first-aid kit to Sector 4", distance: "0.6 km", reward: 40, urgency: "MEDIUM" },
    { id: "v2", title: "Mesh Node Signal Bridge setup at Hill Point", distance: "1.4 km", reward: 75, urgency: "HIGH" },
    { id: "v3", title: "Translate emergency protocol for visitor group", distance: "2.5 km", reward: 30, urgency: "LOW" },
  ]);

  // Paid Service Providers Ecosystem state
  const [selectedProviderCategory, setSelectedProviderCategory] = useState<string>("All");
  const [showOperatorForm, setShowOperatorForm] = useState<boolean>(false);
  const [operatorFormSubmitted, setOperatorFormSubmitted] = useState<boolean>(false);

  // Provider Form State
  const [opName, setOpName] = useState("");
  const [opCategory, setOpCategory] = useState("Ambulance");
  const [opVehicle, setOpVehicle] = useState("");
  const [opLicense, setOpLicense] = useState("");
  const [opFee, setOpFee] = useState("");
  const [opPhone, setOpPhone] = useState("");

  const [serviceProviders, setServiceProviders] = useState([
    { id: "p1", name: "Sukhdev Singh", category: "Tractor Owner", service: "De-blocking & Tractor Mud towing", fee: "₹500 / hr", vehicle: "John Deere 5050D", phone: "+91 98765 66666", rating: "4.9 ⭐", verified: true },
    { id: "p2", name: "Ramesh Chand", category: "Ambulance", service: "Critical Care Patient Transport", fee: "₹15 / km (Base)", vehicle: "Force Traveller Basic", phone: "+91 98765 77777", rating: "4.8 ⭐", verified: true },
    { id: "p3", name: "Amit Kumar", category: "Ambulance", service: "Advanced Trauma Support Delivery", fee: "₹18 / km (Base)", vehicle: "Tata Winger ICU", phone: "+91 98765 88888", rating: "5.0 ⭐", verified: true },
    { id: "p4", name: "Rajesh Kulkarni", category: "Mechanic", service: "Diesel Engine & Offroad Recovery", fee: "₹300 flat + material", vehicle: "Mobile Service Kit", phone: "+91 98765 99999", rating: "4.7 ⭐", verified: true },
    { id: "p5", name: "Harpreet Deol", category: "Local Driver", service: "Emergency Night Transport (4x4 Jeep)", fee: "₹12 / km", vehicle: "Mahindra Thar 4WD", phone: "+91 98765 00001", rating: "4.9 ⭐", verified: true },
    { id: "p6", name: "Vikas Oxygen Suppliers", category: "Equipment Provider", service: "Oxygen Concentrators & Splint rentals", fee: "Quote-based", vehicle: "Diagnostic Center Depot", phone: "+91 98765 00002", rating: "4.6 ⭐", verified: true },
    { id: "p7", name: "Dr. Vinay Deshmukh", category: "Veterinary Support", service: "Emergency Cattle & Pet Medical Assistance", fee: "₹350 / visit", vehicle: "Mobile Vet Clinic", phone: "+91 98765 00003", rating: "4.9 ⭐", verified: true },
    { id: "p8", name: "Sanjay Sharma", category: "Electrician", service: "Backup Generator & Signal Grid repair", fee: "₹400 flat base fee", vehicle: "Certified Power Technician", phone: "+91 98765 00004", rating: "4.8 ⭐", verified: true },
  ]);

  const handleRegisterDonor = () => {
    setIsRegisteredDonor(!isRegisteredDonor);
  };

  const handleToggleVolunteer = () => {
    setVolunteerStatus(!volunteerStatus);
  };

  const handleClaimTask = (taskId: string, reward: number) => {
    setMatchingTasks(prev => prev.filter(t => t.id !== taskId));
    setVolunteerReputation(prev => prev + reward);
    setTasksCompleted(prev => prev + 1);
  };

  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName || !opPhone || !opFee) {
      alert("Please fill in Name, Phone, and Base Service Fee!");
      return;
    }
    
    // Append to local registry under review (simulated)
    const newOp = {
      id: "p_temp_" + Date.now(),
      name: opName,
      category: opCategory,
      service: `Emergency ${opCategory} Assistance`,
      fee: opFee,
      vehicle: opVehicle || "Verified Operator Vehicle",
      phone: opPhone,
      rating: "Pending Review",
      verified: false
    };

    setServiceProviders(prev => [newOp, ...prev]);
    setOperatorFormSubmitted(true);
  };

  const resetForm = () => {
    setOpName("");
    setOpCategory("Ambulance");
    setOpVehicle("");
    setOpLicense("");
    setOpFee("");
    setOpPhone("");
    setOperatorFormSubmitted(false);
    setShowOperatorForm(false);
  };

  const filteredDonors = selectedBloodType 
    ? donors.filter(d => d.bloodType === selectedBloodType)
    : donors;

  const filteredProviders = selectedProviderCategory === "All"
    ? serviceProviders
    : serviceProviders.filter(p => p.category.toLowerCase().includes(selectedProviderCategory.toLowerCase()) || selectedProviderCategory.toLowerCase().includes(p.category.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[600px] mx-auto px-4 py-4 select-none animate-fade-in text-slate-800 pb-16">
      
      {/* Dynamic 3-Way Selector Header */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab("blood")}
          className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "blood" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-red-500" />
          <span>{t("Blood Registry")}</span>
        </button>
        <button
          onClick={() => setActiveTab("volunteer")}
          className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "volunteer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-500" />
          <span>{t("Volunteer Circle")}</span>
        </button>
        <button
          onClick={() => setActiveTab("providers")}
          className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "providers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t("Local Providers")}</span>
        </button>
      </div>

      {/* BLOOD DONOR TAB VIEW */}
      {activeTab === "blood" && (
        <div className="space-y-5">
          {/* Quick toggle to register as donor */}
          <section className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div className="space-y-1 pr-4">
              <h3 className="font-sans text-sm font-black text-slate-900">{t("Emergency Blood Donor Network")}</h3>
              <p className="text-xs text-slate-500 max-w-[280px] font-medium leading-relaxed font-sans">
                {t("Allow nearby hospitals and verified citizens to match with you in critical shortage events. Voluntary service.")}
              </p>
            </div>
            
            <button
              onClick={handleRegisterDonor}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all shrink-0 cursor-pointer ${
                isRegisteredDonor 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-100" 
                  : "bg-slate-900 hover:bg-slate-950 text-white shadow-sm"
              }`}
            >
              {isRegisteredDonor ? t("✓ Registered") : t("Join Registry")}
            </button>
          </section>

          {/* Blood donor search list */}
          <section className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <div className="space-y-1">
              <h3 className="font-sans text-sm font-black text-slate-900">{t("Match Emergency Blood Types")}</h3>
              <p className="text-xs text-slate-400 font-medium font-sans">
                {t("Select a target blood type to find active matched donors with immediate safety clearance.")}
              </p>
            </div>

            {/* Blood type horizontal list */}
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {["O+", "A-", "AB-", "O-", "B+", "B-", "A+"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBloodType(type)}
                  className={`w-10 h-10 shrink-0 font-mono text-xs font-black rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                    selectedBloodType === type 
                      ? "bg-red-600 border-red-500 text-white shadow-md scale-105" 
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Donor results matching list */}
            <div className="space-y-2.5 pt-1">
              {filteredDonors.length > 0 ? (
                filteredDonors.map((donor) => (
                  <div key={donor.id} className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{donor.name}</span>
                        <span className="font-mono text-[9px] bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded font-black">
                          {donor.bloodType}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                        <span>{donor.distance} {t("km away")}</span>
                        <span>•</span>
                        <span>{t("Last Donated:")} {donor.lastDonated}</span>
                      </div>
                    </div>

                    <a
                      href={`tel:${donor.phone}`}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" /> {t("Contact Donor")}
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <span className="text-2xl">🩸</span>
                  <p className="text-xs font-black text-slate-400 mt-2">{t("No matching blood donors in your sector.")}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{t("Try filtering by other types.")}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* VOLUNTEER PORTAL VIEW */}
      {activeTab === "volunteer" && (
        <div className="space-y-5">
          {/* Volunteer Status Section */}
          <section className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1 pr-4">
                <h3 className="font-sans text-sm font-black text-slate-900">{t("Community Emergency Volunteer Circle")}</h3>
                <p className="text-xs text-slate-500 max-w-[280px] font-medium leading-relaxed font-sans">
                  {t("Earn Community Reputation and unlock distinguished certificates by helping with medical dispatches or local signal routing.")}
                </p>
              </div>

              {/* Status Indicator */}
              <button
                onClick={handleToggleVolunteer}
                className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase rounded-full transition-all border cursor-pointer shrink-0 ${
                  volunteerStatus 
                    ? "bg-emerald-50 border-emerald-300 text-emerald-600 font-black" 
                    : "bg-slate-50 border-slate-300 text-slate-500 hover:text-slate-950 font-bold"
                }`}
              >
                {volunteerStatus ? t("● ACTIVE DUTY") : t("○ INACTIVE")}
              </button>
            </div>

            {/* Volunteer Statistics Scoreboard */}
            {volunteerStatus && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest block font-bold">{t("Reputation points")}</span>
                    <span className="text-base font-black font-mono text-slate-900">{volunteerReputation} pts</span>
                  </div>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>

                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[8px] text-slate-400 uppercase tracking-widest block font-bold">{t("Tasks Fulfilled")}</span>
                    <span className="text-base font-black font-mono text-slate-900">{tasksCompleted} {t("Tasks")}</span>
                  </div>
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            )}
          </section>

          {/* List of active emergency volunteer tasks */}
          <section className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-sans text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              {t("Active Mesh Emergency Tasks")}
            </h3>

            {!volunteerStatus ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <span className="text-2xl">🔒</span>
                <p className="text-xs font-black text-slate-500">{t("Volunteer circle inactive.")}</p>
                <p className="text-[10px] text-slate-400 font-medium px-8 leading-relaxed font-sans">
                  {t("Toggle \"ACTIVE DUTY\" above to sign onto the mesh dispatch network and volunteer for community safety operations.")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchingTasks.length > 0 ? (
                  matchingTasks.map((task) => (
                    <div key={task.id} className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex items-center justify-between hover:border-blue-500/20 transition-all">
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 truncate block">{t(task.title)}</span>
                          <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded font-black ${
                            task.urgency === "HIGH" ? "bg-red-50 text-red-600 border border-red-100" :
                            task.urgency === "MEDIUM" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {t(task.urgency)}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold font-mono text-slate-400">
                          <span>{t("Distance:")} {task.distance}</span>
                          <span className="mx-1">•</span>
                          <span className="text-blue-600">+{task.reward} {t("reputation pts")}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaimTask(task.id, task.reward)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        {t("Claim")} <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <span className="text-2xl">🎉</span>
                    <p className="text-xs font-black text-slate-400 mt-2">{t("All local mesh tasks have been fulfilled!")}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t("Excellent work safeguarding the community.")}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* NEW VERIFIED PAID SERVICE PROVIDERS TAB */}
      {activeTab === "providers" && (
        <div className="space-y-5">
          {/* Important Information Banner on Fees/Commission */}
          <section className="bg-white border border-slate-200 p-5 rounded-3xl space-y-3.5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans text-sm font-black text-slate-900">{t("Professional Service Providers")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold font-sans">
                  {t("Citizens requiring machinery towing, tractor clearing, private ambulance dispatches, or emergency electrician services can coordinate here.")}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/70 p-3 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[9px] font-black text-amber-700 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {t("Direct Payment Terms")}
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed font-semibold font-sans">
                {t("Unlike our voluntary blood donor or emergency responder systems, service providers here charge direct service fees. Payment is made directly by the citizen to the operator. Sahara does not handle these payouts directly.")}
              </p>
              <div className="text-[9.5px] text-emerald-700 font-extrabold flex items-center gap-1 border-t border-amber-200/50 pt-1.5 mt-1">
                <Landmark className="w-3.5 h-3.5" /> {t("Future platform model: 5% service commission on completed bookings.")}
              </div>
            </div>

            {/* Application Form Toggle Button */}
            {!showOperatorForm && (
              <button
                onClick={() => setShowOperatorForm(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-sans text-xs font-black rounded-xl transition-colors uppercase tracking-wider cursor-pointer"
              >
                {t("Become a Verified Paid Operator")}
              </button>
            )}
          </section>

          {/* Operator Registration Sub-form */}
          {showOperatorForm && (
            <section className="bg-white border border-slate-200 p-5 rounded-3xl shadow-md space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="font-sans text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  {t("Operator Registration Portal")}
                </h4>
                <button
                  onClick={() => setShowOperatorForm(false)}
                  className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>

              {operatorFormSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-slate-900">{t("Application Submitted Under Review")}</h5>
                    <p className="text-[10px] text-slate-500 max-w-[280px] mx-auto leading-relaxed font-sans">
                      Your operator application for <b>{opCategory}</b> is being dispatched to regional Sahara Node Operators. A validator will review your credentials and contact you shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-lg cursor-pointer"
                  >
                    {t("Register Another Vehicle")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOperatorSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">{t("Business / Operator Name")}</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={opName}
                        onChange={(e) => setOpName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-900"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">{t("Category Service")}</label>
                      <select
                        value={opCategory}
                        onChange={(e) => setOpCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-900 font-sans"
                      >
                        <option value="Ambulance">{t("Ambulance Driver") || "Ambulance Driver"}</option>
                        <option value="Local Driver">{t("Emergency Offroad Driver") || "Emergency Offroad Driver"}</option>
                        <option value="Tractor Owner">{t("Verified Tractor Owner") || "Verified Tractor Owner"}</option>
                        <option value="Mechanic">{t("Verified Mechanic") || "Verified Mechanic"}</option>
                        <option value="Electrician">{t("Verified Electrician") || "Verified Electrician"}</option>
                        <option value="Equipment Provider">{t("Equipment Rental Supplier") || "Equipment Rental Supplier"}</option>
                        <option value="Veterinary Support">{t("Emergency Vet Care") || "Emergency Vet Care"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">{t("Vehicle / Tool Details")}</label>
                      <input
                        type="text"
                        placeholder="e.g. Force Traveller ICU / Tractor model"
                        value={opVehicle}
                        onChange={(e) => setOpVehicle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">{t("Registration / DL License")}</label>
                      <input
                        type="text"
                        placeholder="e.g. MH-43-A-XXXX"
                        value={opLicense}
                        onChange={(e) => setOpLicense(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">{t("Base Service Fee Rate")}</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹15/km base or ₹500/hr"
                        value={opFee}
                        onChange={(e) => setOpFee(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-900"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">{t("Dispatch Mobile Phone")}</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 XXXXX XXXXX"
                        value={opPhone}
                        onChange={(e) => setOpPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg uppercase tracking-wider cursor-pointer shadow-sm shadow-emerald-100"
                    >
                      {t("Submit Application")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOperatorForm(false)}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-lg uppercase cursor-pointer"
                    >
                      {t("Cancel")}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Directory search and results */}
          <section className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <h3 className="font-sans text-sm font-black text-slate-900">{t("Verified Service Directory")}</h3>
              <p className="text-xs text-slate-400 font-medium font-sans">{t("Select a service sector to find active local operators and review their pricing.")}</p>
            </div>

            {/* Service Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {["All", "Ambulance", "Tractor Owner", "Mechanic", "Local Driver", "Equipment Provider", "Veterinary Support", "Electrician"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedProviderCategory(cat)}
                  className={`px-3 py-1.5 shrink-0 font-sans text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer border ${
                    selectedProviderCategory === cat
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-sm scale-105"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat === "All" ? t("Show All") : t(cat)}
                </button>
              ))}
            </div>

            {/* Provider listings */}
            <div className="space-y-3 pt-1">
              {filteredProviders.length > 0 ? (
                filteredProviders.map((prov) => (
                  <div key={prov.id} className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{prov.name}</span>
                        <span className="font-mono text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase">
                          {t(prov.category)}
                        </span>
                        {prov.verified ? (
                          <span className="font-mono text-[8.5px] text-blue-600 font-black flex items-center gap-0.5 uppercase">
                            <ShieldCheck className="w-3 h-3" /> {t("VERIFIED")}
                          </span>
                        ) : (
                          <span className="font-mono text-[8.5px] text-amber-600 font-black flex items-center gap-0.5 uppercase">
                            <AlertTriangle className="w-3 h-3" /> {t("UNDER REVIEW")}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 font-sans">{t(prov.service)}</p>
                      <div className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-2">
                        <span>{t("Vehicle:")} {prov.vehicle}</span>
                        <span>•</span>
                        <span className="text-slate-800 bg-slate-200/50 px-1.5 py-0.5 rounded font-sans">{prov.rating}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 border-slate-200/50 pt-2 sm:pt-0 shrink-0">
                      <div className="text-left sm:text-right space-y-0.5 mb-1.5">
                        <span className="font-mono text-[8px] text-slate-400 font-bold uppercase block">{t("SERVICE CHARGE")}</span>
                        <span className="text-xs font-black text-slate-900 font-mono block">{prov.fee}</span>
                      </div>
                      <a
                        href={`tel:${prov.phone}`}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" /> {t("Dispatch Operator")}
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <span className="text-2xl">🚜</span>
                  <p className="text-xs font-black text-slate-400 mt-2">{t("No matching service providers in your sector.")}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{t("Try another sector or register as an operator.")}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
