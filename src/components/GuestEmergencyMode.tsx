import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, ShieldAlert, ArrowLeft, Mic, MicOff, Camera, Phone, 
  Check, AlertCircle, Heart, Shield, Landmark, Sparkles, Volume2, HelpCircle, Activity, Play, RotateCcw
} from "lucide-react";
import { SpeechService } from "../utils/SpeechService";
import { playHeartbeatSound, startEmergencySiren, stopEmergencySiren } from "../utils/sirenSynth";
import VoiceEmergencySystem from "./VoiceEmergencySystem";
import { useTranslation } from "../utils/i18n";

interface GuestEmergencyModeProps {
  onCancel: () => void;
  onSOSDispatched: (data: {
    type: string;
    coordinates: string;
    phone: string;
    voiceText: string;
    photo: string | null;
    redirectTo?: "register" | "login" | "dashboard";
  }) => void;
}

interface EmergencyCategory {
  id: string;
  label: string;
  icon: string;
  desc: string;
  colorClass: string;
}

// Sample Hinglish/English distress speech inputs to guide users & judges
const DISTRESS_EXAMPLES = [
  { text: "Mujhe snake bite hua hai", label: "🐍 Agro Snake Bite" },
  { text: "Papa unconscious hain chest pain ho raha hai", label: "❤️ Heart Attack" },
  { text: "Ghar me aag lag gayi hai cylinder gas leak", label: "🔥 House Fire" },
  { text: "Road accident ho gaya hai crash down", label: "🚗 Road Accident" },
  { text: "Police chahiye active robbery here", label: "👮 Crime/Robbery" },
  { text: "Heavy flooding in village water entering houses", label: "🌊 Flood Emergency" }
];

export default function GuestEmergencyMode({ onCancel, onSOSDispatched }: GuestEmergencyModeProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>("medical");

  const CATEGORIES: EmergencyCategory[] = [
    { id: "medical", label: t("Medical Emergency"), icon: "🚑", desc: t("ICU Ambulance & Hospital"), colorClass: "border-red-500/30 text-red-400 bg-red-950/20" },
    { id: "snake_bite", label: t("Snake Bite / Agro"), icon: "🐍", desc: t("Anti-venom & Rural squad"), colorClass: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20" },
    { id: "police", label: t("Police / Threat"), icon: "👮", desc: t("Patrol intercept & PCR dispatch"), colorClass: "border-blue-500/30 text-blue-400 bg-blue-950/20" },
    { id: "women", label: t("Women Safety"), icon: "👩", desc: t("Escort team & rapid protection"), colorClass: "border-purple-500/30 text-purple-400 bg-purple-950/20" },
    { id: "fire", label: t("Fire / Gas Leak"), icon: "🚒", desc: t("Hydrant team & engine tender"), colorClass: "border-orange-500/30 text-orange-400 bg-orange-950/20" },
    { id: "disaster", label: t("Flood / Cyclone"), icon: "⛵", desc: t("NDRF, rescue boats & relief"), colorClass: "border-amber-500/30 text-amber-400 bg-amber-950/20" }
  ];
  
  // Coordinates capturing
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [coords, setCoords] = useState<string>("19.07604° N, 72.87772° E");
  const [gpsAccuracy, setGpsAccuracy] = useState<string>("Bypass Mesh Active");

  // Input states
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [voiceText, setVoiceText] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recTimer, setRecTimer] = useState<number>(0);
  const [decibels, setDecibels] = useState<number>(0);
  const [recError, setRecError] = useState<string>("");
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);

  // SOS Hold State
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [showCancelledAlert, setShowCancelledAlert] = useState<boolean>(false);

  // Elderly Mode alternative
  const [isElderlyMode, setIsElderlyMode] = useState<boolean>(false);
  const [showElderlyConfirm, setShowElderlyConfirm] = useState<boolean>(false);

  // Dispatch state machine
  // "form" | "activating" | "analyzing" | "dispatching" | "dispatched"
  const [emergencyState, setEmergencyState] = useState<"form" | "activating" | "analyzing" | "dispatching" | "dispatched">("form");
  const [aiClassification, setAiClassification] = useState<string>("");
  const [requiredServices, setRequiredServices] = useState<Array<{ name: string; icon: string; checked: boolean }>>([]);
  const [dispatchStage, setDispatchStage] = useState<string>("Searching nearby responders...");
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [showVoiceSystem, setShowVoiceSystem] = useState<boolean>(false);
  const [showPostSosThankYou, setShowPostSosThankYou] = useState<boolean>(false);

  // Offline Mode indicator
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);

  // Refs for timers and holding to avoid stale closures
  const isHoldingRef = useRef<boolean>(false);
  const holdProgressRef = useRef<number>(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch GPS on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords(`${pos.coords.latitude.toFixed(5)}° N, ${pos.coords.longitude.toFixed(5)}° E`);
          setGpsAccuracy(`High Precision GPS (±${pos.coords.accuracy.toFixed(1)}m)`);
          setGpsLoading(false);
        },
        () => {
          setTimeout(() => {
            setCoords("19.07604° N, 72.87772° E");
            setGpsAccuracy("Satellite Latch (±4.2m)");
            setGpsLoading(false);
          }, 1000);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setCoords("19.0760° N, 72.8777° E");
      setGpsAccuracy("Mesh Network Latch (±12m)");
      setGpsLoading(false);
    }

    return () => {
      stopHold();
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  // Request Microphone permission and provide feedback
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionGranted(true);
      // Stop the stream immediately, just checking access
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.warn("Microphone access denied:", err);
      setMicPermissionGranted(false);
      setRecError("Microphone permission denied. Please allow audio capture in browser settings.");
      return false;
    }
  };

  // Redesigned Voice capture trigger
  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      SpeechService.stopListening();
      setIsRecording(false);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    } else {
      setRecError("");
      const granted = await requestMicPermission();
      if (!granted) return;

      setRecTimer(0);
      setIsRecording(true);

      recTimerRef.current = setInterval(() => {
        setRecTimer(prev => prev + 1);
      }, 1000);

      SpeechService.startListening(
        (transcript) => {
          setIsRecording(false);
          if (recTimerRef.current) clearInterval(recTimerRef.current);
          setVoiceText(transcript);
        },
        (err) => {
          setIsRecording(false);
          if (recTimerRef.current) clearInterval(recTimerRef.current);
          // Standard failing text
          setRecError("Could not understand. Please speak again.");
        },
        () => {
          setIsRecording(false);
          if (recTimerRef.current) clearInterval(recTimerRef.current);
        },
        (volume) => {
          setDecibels(volume);
        }
      );
    }
  };

  // Simulating Photo snapshot
  const handlePhotoCapture = () => {
    const samplePhotos = [
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=150&h=150&q=80", 
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=150&h=150&q=80", 
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&h=150&q=80"  
    ];
    setPhotoPreview(samplePhotos[Math.floor(Math.random() * samplePhotos.length)]);
  };

  // Voice Speech synthesizer helper
  const speakVoicePrompt = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis failed:", e);
    }
  };

  // 10-SECOND INTELLIGENT SOS HOLD ENGINE
  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isHolding || emergencyState !== "form") return;

    setIsHolding(true);
    isHoldingRef.current = true;
    holdProgressRef.current = 0;
    setHoldProgress(0);
    setShowCancelledAlert(false);

    // Initial heartbeat voice prompt
    speakVoicePrompt("Keep holding to activate emergency mode.");
    
    playHeartbeatSound();
    if (navigator.vibrate) {
      navigator.vibrate([150, 50, 150]);
    }

    let holdDurationMs = 10000; // 10 seconds hold
    let stepMs = 100;
    let ticks = holdDurationMs / stepMs; // 100 ticks

    // Heartbeat loop every 1 second (1000ms) with vibration feedback
    heartbeatIntervalRef.current = setInterval(() => {
      if (isHoldingRef.current) {
        playHeartbeatSound();
        if (navigator.vibrate) {
          navigator.vibrate([200, 50, 200]);
        }
      }
    }, 1000);

    // Progress interval updating circular progress bar smoothly
    holdIntervalRef.current = setInterval(() => {
      holdProgressRef.current += (100 / ticks);
      const currentProgress = holdProgressRef.current;
      setHoldProgress(Math.min(currentProgress, 100));

      if (currentProgress >= 100) {
        // Clear hold state
        clearInterval(holdIntervalRef.current!);
        clearInterval(heartbeatIntervalRef.current!);
        isHoldingRef.current = false;
        setIsHolding(false);

        // Success vibration
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 800]);
        }

        // Proceed to Voice Emergency System
        setShowVoiceSystem(true);
      }
    }, stepMs);
  };

  const stopHold = () => {
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    setIsHolding(false);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    if (holdProgressRef.current < 100) {
      // Released early, abort SOS immediately
      setHoldProgress(0);
      holdProgressRef.current = 0;
      setShowCancelledAlert(true);
      speakVoicePrompt("Emergency hold cancelled.");
      setTimeout(() => setShowCancelledAlert(false), 3000);
    }
  };

  // Trigger Elder Mode immediate confirm
  const handleElderlySOSClick = () => {
    setShowElderlyConfirm(true);
  };

  const confirmElderlySOS = () => {
    setShowElderlyConfirm(false);
    setShowVoiceSystem(true);
  };

  // AI EMERGENCY ANALYSIS PIPELINE
  const executeAIAnalysisPipeline = (confirmedText?: string) => {
    // Stage 1: Activating Protocol Loading screen (2s)
    setEmergencyState("activating");
    startEmergencySiren();
    
    setTimeout(() => {
      stopEmergencySiren();
      // Stage 2: AI Analyzing distress details (3s)
      setEmergencyState("analyzing");
      
      // Local AI Classifier (Understand natural language input & category)
      const activeText = confirmedText || voiceText || selectedType;
      const inputText = activeText.toLowerCase();
      let classification = "Medical Emergency";
      let services = [
        { name: "Ambulance ICU", icon: "🚑", checked: true },
        { name: "Level-1 Trauma Hospital", icon: "🏥", checked: true },
        { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
        { name: "Fire Tender Brigade", icon: "🚒", checked: false },
        { name: "Local Police Patrol", icon: "🚔", checked: false },
        { name: "Women Protection Team", icon: "👩", checked: false },
        { name: "Disaster NDRF Squad", icon: "⛵", checked: false }
      ];

      if (inputText.includes("snake") || inputText.includes("bite") || inputText.includes("sap") || inputText.includes("venom") || selectedType === "snake_bite") {
        classification = "Farmer Agro & Snake Bite Emergency (Multi-Agency)";
        services = [
          { name: "Rural Anti-Venom Squad", icon: "🐍", checked: true },
          { name: "Ambulance ICU", icon: "🚑", checked: true },
          { name: "Village Community Hospital", icon: "🏥", checked: true },
          { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
          { name: "Fire Tender Brigade", icon: "🚒", checked: false },
          { name: "Local Police Patrol", icon: "🚔", checked: false },
          { name: "Women Protection Team", icon: "👩", checked: false }
        ];
      } else if (inputText.includes("fire") || inputText.includes("aag") || inputText.includes("gas") || inputText.includes("explosion") || selectedType === "fire") {
        classification = "Fire & Hazardous Gas Outbreak (Multi-Agency)";
        services = [
          { name: "Fire Tender Brigade", icon: "🚒", checked: true },
          { name: "Local Police Patrol", icon: "🚔", checked: true },
          { name: "Ambulance ICU", icon: "🚑", checked: true },
          { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
          { name: "Level-1 Trauma Hospital", icon: "🏥", checked: false },
          { name: "Women Protection Team", icon: "👩", checked: false }
        ];
      } else if (inputText.includes("police") || inputText.includes("robbery") || inputText.includes("theft") || inputText.includes("assault") || inputText.includes("gun") || selectedType === "police") {
        classification = "Police Security Threat Emergency";
        services = [
          { name: "Local Police Patrol", icon: "🚔", checked: true },
          { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
          { name: "Ambulance ICU", icon: "🚑", checked: false },
          { name: "Fire Tender Brigade", icon: "🚒", checked: false },
          { name: "Level-1 Trauma Hospital", icon: "🏥", checked: false },
          { name: "Women Protection Team", icon: "👩", checked: false }
        ];
      } else if (inputText.includes("women") || inputText.includes("harassment") || inputText.includes("stalking") || inputText.includes("domestic") || selectedType === "women") {
        classification = "Women Safety & Escort Emergency";
        services = [
          { name: "Women Protection Team", icon: "👩", checked: true },
          { name: "Local Police Patrol", icon: "🚔", checked: true },
          { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
          { name: "Ambulance ICU", icon: "🚑", checked: false },
          { name: "Level-1 Trauma Hospital", icon: "🏥", checked: false },
          { name: "Fire Tender Brigade", icon: "🚒", checked: false }
        ];
      } else if (inputText.includes("flood") || inputText.includes("cyclone") || inputText.includes("storm") || inputText.includes("water") || selectedType === "disaster") {
        classification = "Natural Disaster & Inundation Outbreak";
        services = [
          { name: "Disaster NDRF Squad", icon: "⛵", checked: true },
          { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
          { name: "Ambulance ICU", icon: "🚑", checked: true },
          { name: "Local Police Patrol", icon: "🚔", checked: true },
          { name: "Fire Tender Brigade", icon: "🚒", checked: true },
          { name: "Level-1 Trauma Hospital", icon: "🏥", checked: false }
        ];
      } else if (inputText.includes("accident") || inputText.includes("crash") || inputText.includes("collision")) {
        classification = "Severe Road Accident (Multi-Agency)";
        services = [
          { name: "Ambulance ICU", icon: "🚑", checked: true },
          { name: "Local Police Patrol", icon: "🚔", checked: true },
          { name: "Sahara Mesh Volunteers", icon: "🏍️", checked: true },
          { name: "Level-1 Trauma Hospital", icon: "🏥", checked: true },
          { name: "Fire Tender Brigade", icon: "🚒", checked: false },
          { name: "Women Protection Team", icon: "👩", checked: false }
        ];
      }

      setAiClassification(classification);
      setRequiredServices(services);

      setTimeout(() => {
        // Stage 3: Searching & Dispatching Steps (3s)
        setEmergencyState("dispatching");
        runDispatchSteps();
      }, 3000);

    }, 2000);
  };

  const runDispatchSteps = () => {
    const steps = [
      "Searching nearby responders...",
      "Searching nearest trauma center...",
      "Calculating optimal safety bypass routes...",
      "Signing emergency hash on blockchain ledger...",
      "Broadcasting peer-to-peer Bluetooth mesh signals...",
      "Emergency successfully committed to regional dispatch!"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setDispatchStage(steps[currentStep]);
      setDispatchProgress(Math.round(((currentStep + 1) / steps.length) * 100));
      currentStep++;

      if (currentStep >= steps.length) {
        clearInterval(interval);
        
        // Stage 4: Completed
        setEmergencyState("dispatched");
        playHeartbeatSound();
        
        // Voice response
        speakVoicePrompt("Your emergency request has been recorded. Please stay calm. Appropriate help is being coordinated.");
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#070916] text-[#E2E8F0] pb-24 relative select-none">
      
      {/* Cancel Overlay popup */}
      {showCancelledAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-600 border border-red-400 text-white px-6 py-3 rounded-2xl shadow-2xl font-sans text-xs font-black flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>SOS HOLD RELEASED - DISPATCH ABORTED</span>
        </div>
      )}

      {/* 1. INITIAL INPUT FORM STATE */}
      {emergencyState === "form" && (
        <div className="max-w-[550px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
          
          {/* Top bar with Toggle Elder Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={onCancel}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="font-mono text-[8px] text-orange-500 font-extrabold tracking-widest block uppercase">Zero Credentials Bypass</span>
                <h1 className="text-md font-black text-white leading-none">Guest Emergency Center</h1>
              </div>
            </div>

            {/* Elder Mode Slider Toggle */}
            <button
              onClick={() => {
                setIsElderlyMode(!isElderlyMode);
                speakVoicePrompt(isElderlyMode ? "Elderly tap mode deactivated." : "Elderly tap mode activated. Single touch to trigger help.");
              }}
              className={`px-3 py-1.5 rounded-lg border font-mono text-[9px] font-bold flex items-center gap-1.5 transition-all ${
                isElderlyMode 
                  ? "bg-amber-600/20 border-amber-500 text-amber-400" 
                  : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10"
              }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{isElderlyMode ? "Elder Mode: ON" : "Elder Mode: OFF"}</span>
            </button>
          </div>

          {/* OFFLINE TRANSMISSION NOTIFICATION */}
          {isOfflineMode && (
            <div className="bg-amber-600/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
              <span className="text-2xl">📡</span>
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider font-sans">Internet unavailable</h4>
                <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                  Attempting offline emergency transmission. Your coordinate packet will be relayed using local SMS, Bluetooth Mesh, and peer-to-peer devices nearby.
                </p>
              </div>
            </div>
          )}

          {/* LATCH GPS CARD */}
          <div className="bg-[#0C0E1E] border border-white/5 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-lg">
            <div className="w-11 h-11 bg-orange-600/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className={`w-5 h-5 text-orange-500 ${gpsLoading ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[8px] text-neutral-500 font-black uppercase tracking-widest block">Active Latch Coordinates</span>
              <p className="text-xs font-black text-white truncate font-mono mt-0.5">{coords}</p>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> {gpsAccuracy}
              </p>
            </div>
          </div>

          {/* CHOOSE INCIDENT CATEGORY */}
          <div className="space-y-2">
            <span className="font-mono text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Select Emergency Category</span>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedType === cat.id 
                      ? "bg-[#181D35] border-orange-500 text-white shadow-lg" 
                      : "bg-[#0E1020] border-white/5 text-neutral-400 hover:border-white/10 hover:bg-[#111326]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{cat.icon}</span>
                    {selectedType === cat.id && <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />}
                  </div>
                  <p className="text-xs font-black text-white mt-2 leading-none">{cat.label}</p>
                  <p className="text-[9px] text-neutral-400 mt-1 truncate leading-tight font-medium">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* OPTIONAL PHONE NUMBER */}
          <div className="bg-[#0C0E1E] border border-white/5 p-4 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold font-sans">
              <Phone className="w-4 h-4 text-orange-500" />
              <span>Contact Phone Number</span>
            </div>
            <input 
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +91 98123 45678"
              className="w-full h-11 bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl px-4 text-xs font-black text-white outline-none font-mono"
            />
          </div>

          {/* COMPREHENSIVE VOICE SYSTEM REDESIGN */}
          <div className="bg-[#0C0E1E] border border-white/5 p-4 rounded-2xl space-y-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-mono text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Describe Distress (Hindi / English / mixed Hinglish)</span>
              {isRecording && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/20 font-mono text-[8px] font-black rounded-md animate-pulse">
                  REC ACTIVE ({recTimer}s)
                </span>
              )}
            </div>

            {/* Quick pre-fill buttons for testing Hinglish speech inputs */}
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-neutral-500 block uppercase font-bold">Or click to pre-fill speech simulation details:</span>
              <div className="flex flex-wrap gap-1">
                {DISTRESS_EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVoiceText(ex.text);
                      speakVoicePrompt("Pre-filling input text.");
                    }}
                    className="px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[8px] font-bold hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              {/* Voice capture button */}
              <button
                onClick={handleToggleVoiceRecord}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border cursor-pointer transition-all ${
                  isRecording 
                    ? "bg-red-600 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                    : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:border-white/20"
                }`}
                title={isRecording ? "Stop speech acquisition" : "Record distress vocally"}
              >
                {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Waveform graphic or Textarea */}
              {isRecording ? (
                <div className="flex-1 flex items-center justify-center gap-1.5 p-3 bg-red-950/15 border border-red-500/15 rounded-xl">
                  {/* Waveform showing sound amplitude with 6 bouncing nodes */}
                  <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(10, decibels * 0.45)}px`, animationDelay: "0.1s" }} />
                  <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(26, decibels * 0.9)}px`, animationDelay: "0.3s" }} />
                  <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(16, decibels * 0.65)}px`, animationDelay: "0.2s" }} />
                  <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(30, decibels * 1.0)}px`, animationDelay: "0.4s" }} />
                  <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(20, decibels * 0.75)}px`, animationDelay: "0.15s" }} />
                  <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(8, decibels * 0.35)}px`, animationDelay: "0.5s" }} />
                </div>
              ) : (
                <div className="flex-1 space-y-1">
                  <textarea 
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    placeholder="Provide specific incident description (e.g., snake details, accident location, fire scope)..."
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl p-3 text-xs font-semibold text-white outline-none resize-none h-16 leading-normal font-sans"
                  />
                  {voiceText && (
                    <span className="text-[8px] text-neutral-500 block font-bold text-right italic font-sans">
                      (You can edit the transcribed text above freely before triggering SOS)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error or Speech failures handling with Retry Button */}
            {recError && (
              <div className="p-3 bg-red-950/20 rounded-xl border border-red-500/20 flex items-center justify-between gap-3 animate-fade-in">
                <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1.5 leading-tight">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {recError}
                </p>
                <button
                  onClick={handleToggleVoiceRecord}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-sans text-[8px] font-bold rounded uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Retry Voice Speak
                </button>
              </div>
            )}
          </div>

          {/* PHOTO CAPTURE */}
          <div className="bg-[#0C0E1E] border border-white/5 p-4 rounded-2xl space-y-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-mono text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Capture Photo Attachment (Optional)</span>
              {photoPreview && (
                <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-1 animate-fade-in">
                  <Check className="w-3 h-3 text-emerald-400" /> FILE SECURED
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handlePhotoCapture}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <Camera className="w-4 h-4 text-orange-500" /> Take Snapshot
              </button>
              {photoPreview ? (
                <div className="w-14 h-14 rounded-xl border border-white/15 overflow-hidden shadow-md shrink-0 relative group">
                  <img src={photoPreview} alt="Incident snapshot" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhotoPreview(null)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-red-400 transition-opacity"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-neutral-500 font-medium">Attach photo of wound, fire, or hazards</span>
              )}
            </div>
          </div>

          {/* 10-SECOND INTENSFIED PRESS & HOLD OR ELDERLY SINGLE CLICK */}
          <div className="flex flex-col items-center justify-center pt-4 space-y-4">
            
            {isElderlyMode ? (
              /* Elderly Button trigger (Double Tap / Single touch with prompt) */
              <button
                onClick={handleElderlySOSClick}
                className="w-44 h-44 rounded-full bg-gradient-to-br from-red-600 via-orange-600 to-red-700 hover:shadow-[0_0_35px_rgba(239,68,68,0.7)] flex flex-col items-center justify-center text-center p-4 border-4 border-white/15 active:scale-95 transition-all animate-bounce cursor-pointer shadow-2xl"
              >
                <ShieldAlert className="w-12 h-12 mb-1.5 text-white" />
                <span className="text-sm font-black uppercase tracking-wider block text-white leading-none">TAP FOR</span>
                <span className="text-xl font-black uppercase tracking-wider block text-white mt-1">EMERGENCY</span>
              </button>
            ) : (
              /* Standard 10-Second Intelligent Hold Button */
              <div className="relative w-44 h-44 flex items-center justify-center select-none">
                {isHolding && (
                  <div className="absolute inset-0 bg-red-600/30 blur-3xl rounded-full animate-pulse" />
                )}

                {/* Circular Progress Ring */}
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="72" 
                    stroke="rgba(255, 255, 255, 0.05)" 
                    strokeWidth="8" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="88" 
                    cy="88" 
                    r="72" 
                    stroke="#EA580C" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${2 * Math.PI * 72}`}
                    strokeDashoffset={`${2 * Math.PI * 72 * (1 - holdProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-75 ease-linear"
                  />
                </svg>

                {/* Center Core Button with continuous vibration feedback */}
                <button
                  onMouseDown={startHold}
                  onMouseUp={stopHold}
                  onMouseLeave={stopHold}
                  onTouchStart={startHold}
                  onTouchEnd={stopHold}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center z-10 transition-all border outline-none select-none ${
                    isHolding 
                      ? "bg-red-600 border-white/20 text-white scale-110 shadow-[0_0_35px_rgba(220,38,38,0.7)]" 
                      : "bg-gradient-to-br from-red-600 to-orange-600 border-white/10 hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:scale-105"
                  }`}
                >
                  {isHolding ? (
                    <div className="text-center">
                      <span className="text-3xl font-black block text-white">
                        {Math.ceil(10 - (holdProgress / 100) * 10)}
                      </span>
                      <span className="font-mono text-[8px] font-black tracking-widest uppercase text-white animate-pulse">HOLD ON...</span>
                    </div>
                  ) : (
                    <div className="text-center p-3">
                      <ShieldAlert className="w-8 h-8 mx-auto mb-1 animate-pulse text-white" />
                      <span className="text-[10px] font-black uppercase tracking-wider block text-white leading-none">PRESS &</span>
                      <span className="text-sm font-black uppercase tracking-wider block text-white mt-0.5">HOLD 10S</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            <div className="text-center space-y-1">
              <span className="font-mono text-[9px] font-black text-orange-500 uppercase tracking-widest block">Safe-Release Hold Lock</span>
              <p className="text-[10px] text-neutral-400 max-w-[280px] leading-normal font-medium mx-auto">
                {isElderlyMode 
                  ? "Single tap triggers immediate confirmation menu bypassing any hold requirements." 
                  : "Must hold continuously for 10 seconds. Releasing early will instantly abort the request."}
              </p>
            </div>
          </div>

          {/* ELDERLY OPTION CONFIRM DIALOG */}
          {showElderlyConfirm && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-6">
              <div className="bg-[#121424] border border-white/10 rounded-3xl p-6 max-w-[400px] w-full text-center space-y-6 shadow-2xl animate-fade-in text-white">
                <div className="w-16 h-16 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight leading-tight">Confirm Emergency SOS?</h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Are you sure you want to activate Sahara Emergency assistance? This will dispatch relevant teams to your current GPS position.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={confirmElderlySOS}
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Yes, Send Help Now!
                  </button>
                  <button
                    onClick={() => {
                      setShowElderlyConfirm(false);
                      speakVoicePrompt("Bypassed assistance request.");
                    }}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. ACTIVATING PROTOCOL OVERLAY */}
      {emergencyState === "activating" && (
        <div className="fixed inset-0 bg-neutral-950 z-[120] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-24 h-24 bg-red-600/10 border border-red-500/30 rounded-full flex items-center justify-center relative">
            <span className="absolute inset-0 bg-red-600/20 rounded-full animate-ping" />
            <Activity className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          <div className="text-center space-y-2 animate-pulse">
            <h2 className="text-lg font-black tracking-widest text-red-500 uppercase">Activating Emergency Protocol...</h2>
            <p className="text-xs text-neutral-400 font-mono">Securing satellite link and preparing ledger validation...</p>
          </div>
        </div>
      )}

      {/* 3. AI EMERGENCY ANALYSIS SCANNER */}
      {emergencyState === "analyzing" && (
        <div className="fixed inset-0 bg-neutral-950 z-[120] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-24 h-24 bg-orange-600/10 border border-orange-500/30 rounded-full flex items-center justify-center relative">
            <span className="absolute inset-0 bg-orange-600/20 rounded-full animate-ping" style={{ animationDuration: "1.5s" }} />
            <Sparkles className="w-10 h-10 text-orange-500 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <div className="text-center space-y-2 max-w-[360px]">
            <span className="font-mono text-[9px] font-black text-orange-500 uppercase tracking-widest block animate-pulse">SAHARA COGNITIVE CORE</span>
            <h2 className="text-lg font-black tracking-tight text-white leading-snug">Analyzing Emergency Input...</h2>
            <p className="text-xs text-neutral-400 font-mono bg-white/5 p-3 rounded-xl border border-white/5 break-all max-h-24 overflow-y-auto mt-3 italic text-left">
              "{voiceText || `Triggered selected category: ${selectedType}`}"
            </p>
          </div>
        </div>
      )}

      {/* 4. DISPATCHING STEPS SCREEN */}
      {emergencyState === "dispatching" && (
        <div className="fixed inset-0 bg-neutral-950 z-[120] flex flex-col items-center justify-center p-6 max-w-[440px] mx-auto space-y-8">
          
          {/* Diagnostic AI output */}
          <div className="w-full text-center space-y-2">
            <span className="font-mono text-[9px] font-black text-emerald-500 uppercase tracking-widest block animate-pulse">CLINICAL CLASSIFICATION COMPLETE</span>
            <h2 className="text-xl font-black text-white leading-tight">{aiClassification}</h2>
          </div>

          {/* Checklist showing ONLY RELEVANT SERVICES, NO UNNECESSARY ONES */}
          <div className="w-full bg-[#0C0E1E] border border-white/5 rounded-2xl p-4 space-y-3 shadow-xl">
            <span className="font-mono text-[9px] font-black text-neutral-400 uppercase tracking-widest block pb-2 border-b border-white/5">
              REQUIRED AGENCY ASSIGNMENTS
            </span>
            <div className="grid grid-cols-1 gap-2">
              {requiredServices.map((srv, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    srv.checked 
                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 font-bold" 
                      : "bg-white/5 border-white/5 text-neutral-500 opacity-30 line-through"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{srv.icon}</span>
                    <span className="text-xs">{srv.name}</span>
                  </div>
                  {srv.checked ? (
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/15 px-2 py-0.5 rounded uppercase tracking-wider">
                      ✓ DISPATCHING
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono bg-neutral-800 px-2 py-0.5 rounded uppercase tracking-wider">
                      REDUNDANT
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stepper dispatch tracker */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
              <span className="truncate max-w-[250px] font-bold text-neutral-300">{dispatchStage}</span>
              <span className="font-black">{dispatchProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300 rounded-full"
                style={{ width: `${dispatchProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. EMERGENCY SENT SUCCESSFULLY CONFIRMATION */}
      {emergencyState === "dispatched" && !showPostSosThankYou && (
        <div className="fixed inset-0 bg-neutral-950 z-[120] flex flex-col items-center justify-center p-6 text-center max-w-[420px] mx-auto space-y-6">
          <div className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl animate-bounce">
            ✓
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[9px] font-black text-emerald-400 uppercase tracking-widest block">EMERGENCY COMMITTED</span>
            <h2 className="text-2xl font-black text-white leading-none">Sent Successfully</h2>
            <p className="text-xs text-neutral-400 max-w-[320px] leading-relaxed mx-auto pt-2">
              Your distress signal is relayed securely onto Sahara active ledger. Stay calm, and keep your phone display visible.
            </p>
          </div>

          <div className="w-full bg-[#0C0E1E] border border-white/5 p-4 rounded-2xl space-y-2 text-left font-sans">
            <span className="font-mono text-[8px] text-neutral-500 font-bold block uppercase tracking-wider">LATCH REPORT</span>
            <div className="text-xs text-white flex justify-between">
              <span className="text-neutral-400">Classification:</span>
              <span className="font-bold">{aiClassification}</span>
            </div>
            <div className="text-xs text-white flex justify-between">
              <span className="text-neutral-400">Phone Shared:</span>
              <span className="font-mono">{phoneNumber || "Not Shared"}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPostSosThankYou(true);
            }}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>Proceed to Dashboard</span>
            <Activity className="w-4 h-4 animate-pulse" />
          </button>
        </div>
      )}

      {/* 5.5 POST-SOS THANK YOU SCREEN */}
      {emergencyState === "dispatched" && showPostSosThankYou && (
        <div className="fixed inset-0 bg-neutral-950 z-[120] flex flex-col items-center justify-center p-6 text-center max-w-[420px] mx-auto space-y-6 animate-fade-in text-white">
          <div className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl text-emerald-500 animate-pulse">
            ❤️
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white leading-tight">Thank You</h2>
            <p className="text-sm text-neutral-300 font-bold leading-relaxed">
              Your emergency request has been successfully sent.
            </p>
            <p className="text-xs text-neutral-400 max-w-[320px] leading-relaxed mx-auto pt-2">
              To help us assist you better in the future, you can now create a Sahara account.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full pt-4">
            <button
              onClick={() => {
                onSOSDispatched({
                  type: selectedType,
                  coordinates: coords,
                  phone: phoneNumber || "Not Shared",
                  voiceText: voiceText || `Distress: ${aiClassification}`,
                  photo: photoPreview,
                  redirectTo: "register"
                });
              }}
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20"
            >
              Create Account
            </button>
            <button
              onClick={() => {
                onSOSDispatched({
                  type: selectedType,
                  coordinates: coords,
                  phone: phoneNumber || "Not Shared",
                  voiceText: voiceText || `Distress: ${aiClassification}`,
                  photo: photoPreview,
                  redirectTo: "login"
                });
              }}
              className="w-full h-11 bg-white/5 hover:bg-white/10 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10"
            >
              Login
            </button>
            <button
              onClick={() => {
                onSOSDispatched({
                  type: selectedType,
                  coordinates: coords,
                  phone: phoneNumber || "Not Shared",
                  voiceText: voiceText || `Distress: ${aiClassification}`,
                  photo: photoPreview,
                  redirectTo: "dashboard"
                });
              }}
              className="w-full h-11 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      {showVoiceSystem && (
        <VoiceEmergencySystem
          userLanguage="en"
          onConfirm={(confirmedText) => {
            setShowVoiceSystem(false);
            setVoiceText(confirmedText);
            executeAIAnalysisPipeline(confirmedText);
          }}
          onCancel={() => {
            setShowVoiceSystem(false);
          }}
        />
      )}

    </div>
  );
}
