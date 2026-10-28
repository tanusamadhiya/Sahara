import { useState, useEffect, useRef, useCallback } from "react";
import { 
  MapPin, ShieldAlert, Navigation, Heart, Calendar, Activity, CheckCircle2, 
  ShieldCheck, AlertTriangle, MessageCircle, PhoneCall, RefreshCw, Award, 
  Landmark, Coins, ArrowUpRight, TrendingUp, AlertCircle, Droplets, CloudLightning, 
  Sparkles, Truck, Users, FileCheck, Phone, CheckSquare, Globe, Sun, Moon, 
  ChevronRight, HeartPulse, User, Clock, Compass, Shield, MessageSquare, Send
} from "lucide-react";

import { UserProfile, SOSRequest } from "./types";
import { playWarningBeep, startEmergencySiren, stopEmergencySiren, setSirenMute, isSirenMuted, playHeartbeatSound } from "./utils/sirenSynth";
import SplashScreen from "./components/SplashScreen";
import Onboarding from "./components/Onboarding";
import AuthScreen from "./components/AuthScreen";
import VoiceAssistant from "./components/VoiceAssistant";
import HealthIdScreen from "./components/HealthIdScreen";
import VolunteerBloodScreen from "./components/VolunteerBloodScreen";
import FamilyCircle from "./components/FamilyCircle";
import VillageCredits from "./components/VillageCredits";
import DisasterAnalytics from "./components/DisasterAnalytics";
import ResponderDashboard from "./components/ResponderDashboard";
import MapComponent from "./components/MapComponent";
import WeatherForecastSystem from "./components/WeatherForecastSystem";
import WhatsAppEmergencyModal from "./components/WhatsAppEmergencyModal";

import EmergencyLandingPage from "./components/EmergencyLandingPage";
import GuestEmergencyMode from "./components/GuestEmergencyMode";
import VoiceEmergencySystem from "./components/VoiceEmergencySystem";
import { useTranslation } from "./utils/i18n";
import { 
  getStoredFamilyContacts, 
  generateEmergencyWhatsAppMessage 
} from "./utils/whatsappEmergency";

const coordinatorNetworkArt = new URL("./assets/coordinator-network.svg", import.meta.url).href;
const protectMapArt = new URL("./assets/protect-map-art.svg", import.meta.url).href;

const GUEST_PROFILE: UserProfile = {
  id: "GUEST",
  name: "Emergency Guest",
  email: "guest@sahara.gov.in",
  phone: "",
  bloodType: "O+",
  healthId: "NHID-PENDING",
  allergies: [],
  medications: [],
  insuranceProvider: "",
  policyNumber: "",
  emergencyContactName: "Not Registered",
  emergencyContactPhone: "",
  safetyScore: 100,
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
  language: "en",
  theme: "light",
  credits: 0,
  villageScore: 100,
  gender: "Female",
  age: 0,
  medicalConditions: [],
  disabilities: [],
  address: "",
  district: "",
  village: "",
  emergencyContacts: [],
  healthNotes: "Guest bypass protocol. Registered profile details pending."
};

export default function App() {
  const { language, setLanguage, t: globalT } = useTranslation();
  // Screen Routing State
  const [screen, setScreen] = useState<"splash" | "onboarding" | "landing" | "guest_sos" | "auth" | "dashboard">("splash");
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "protect" | "history" | "profile">("home");
  const [showRegPromptModal, setShowRegPromptModal] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Elderly Mode & Smartwatch Simulator States
  const [isElderlyMode, setIsElderlyMode] = useState<boolean>(false);
  const [showElderlyConfirm, setShowElderlyConfirm] = useState<boolean>(false);
  const [showWatchSimulator, setShowWatchSimulator] = useState<boolean>(false);
  const [watchSosProgress, setWatchSosProgress] = useState<number>(0);
  const [watchPulseActive, setWatchPulseActive] = useState<boolean>(false);
  const [watchStatusText, setWatchStatusText] = useState<string>("");
  const [showDashboardLoading, setShowDashboardLoading] = useState<boolean>(false);
  const [dashboardLoadingText, setDashboardLoadingText] = useState<string>("");
  const [showVoiceSystem, setShowVoiceSystem] = useState<boolean>(false);

  // Secondary Overlay Screen States
  const [activeOverlay, setActiveOverlay] = useState<null | "family" | "disaster" | "volunteer" | "admin">(null);
  const [guestRestrictedFeature, setGuestRestrictedFeature] = useState<string | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");
  const [authCancelRedirect, setAuthCancelRedirect] = useState<"landing" | "dashboard">("landing");

  // User Authentication State
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const cached = localStorage.getItem("sahara_current_user");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return GUEST_PROFILE;
  });

  // Keep localStorage current user in sync
  useEffect(() => {
    localStorage.setItem("sahara_current_user", JSON.stringify(user));
  }, [user]);

  // Sync user.language to the global language state whenever the latter changes
  useEffect(() => {
    if (user.language !== language) {
      setUser(prev => ({ ...prev, language }));
    }
  }, [language]);

  // On login or user change, set the global language to the user's preferred language
  useEffect(() => {
    if (user.language && user.language !== language) {
      setLanguage(user.language);
    }
  }, [user.id]);

  const checkGuestRestriction = (featureName: string): boolean => {
    if (user.id === "GUEST") {
      setGuestRestrictedFeature(featureName);
      return true;
    }
    return false;
  };

  // SOS Active State
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [showSentOverlay, setShowSentOverlay] = useState<boolean>(false);
  const [showCancelledPopup, setShowCancelledPopup] = useState<boolean>(false);
  const [sosPlan, setSosPlan] = useState<{
    severity: string;
    dispatchVehicle: string;
    estimatedEta: number;
    actionSteps: string[];
    responderInstruction: string;
  } | null>(null);

  const [dynamicEta, setDynamicEta] = useState<number>(4);
  const [dynamicDistance, setDynamicDistance] = useState<number>(4.2);
  const [sosPhase, setSosPhase] = useState<number>(1);
  const [isSirenMutedState, setIsSirenMutedState] = useState<boolean>(false);
  const [blockchainData, setBlockchainData] = useState<{
    txId: string;
    blockNumber: number;
    hash: string;
    merkleRoot: string;
    timestamp: string;
  } | null>(null);

  // Online/Offline status and outbox queue
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("sahara_offline_queue") || "[]");
    } catch {
      return [];
    }
  });
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync offline outbox
      try {
        const queued = JSON.parse(localStorage.getItem("sahara_offline_queue") || "[]");
        if (queued.length > 0) {
          setShowSyncSuccess(true);
          localStorage.removeItem("sahara_offline_queue");
          setOfflineQueue([]);
          setTimeout(() => setShowSyncSuccess(false), 5000);
        }
      } catch (e) {
        console.error("Failed to sync offline queue:", e);
      }
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
  }, []);

  // Weather System States
  const [showWeatherDashboard, setShowWeatherDashboard] = useState<boolean>(false);
  const [weatherCoords, setWeatherCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [homeWeatherData, setHomeWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  const fetchHomeWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setHomeWeatherData(data);
        setWeatherCoords({ lat, lon });
      }
    } catch (err) {
      console.error("Failed to load compact home weather", err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    // Attempt cached weather first for ultra-fast startup
    const cachedWeather = localStorage.getItem("sahara_cached_weather");
    const cachedCoords = localStorage.getItem("sahara_weather_coords");
    
    if (cachedWeather) {
      try {
        setHomeWeatherData(JSON.parse(cachedWeather));
      } catch (e) {}
    }
    if (cachedCoords) {
      try {
        const parsed = JSON.parse(cachedCoords);
        setWeatherCoords(parsed);
        fetchHomeWeather(parsed.lat, parsed.lon);
        return; // Skip geolocation if cached
      } catch (e) {}
    }

    // Lazy load GPS based on permission on startup
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchHomeWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Lazy geolocation in background skipped/rejected", err);
        },
        { timeout: 6000 }
      );
    }
  }, []);

  // SOS Hold Press states
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [sosSuccessToast, setSosSuccessToast] = useState<boolean>(false);
  const holdProgressRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger dark mode CSS bindings
  useEffect(() => {
    const root = window.document.documentElement;
    if (user.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [user.theme]);

  // Handle successful login
  const handleLoginSuccess = (userProfile: UserProfile) => {
    setUser(userProfile);
    setScreen("dashboard");
  };

  // Demo Mode and Smartwatch simulation states
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [watchBpm, setWatchBpm] = useState<number>(78);
  const [watchTime, setWatchTime] = useState<string>("10:42");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setWatchTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWatchBpm(76 + Math.floor(Math.random() * 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Advance SOS active phases dynamically over time (8 Phases)
  useEffect(() => {
    if (!sosActive) {
      setSosPhase(1);
      stopEmergencySiren();
      return;
    }

    // Phase 1 immediately active, plays siren
    startEmergencySiren();
    setIsSirenMutedState(isSirenMuted());

    const stepDelay = isDemoMode ? 1000 : 2500;

    const timers: NodeJS.Timeout[] = [];
    for (let p = 2; p <= 8; p++) {
      timers.push(
        setTimeout(() => {
          setSosPhase(p);
        }, (p - 1) * stepDelay)
      );
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [sosActive, isDemoMode]);

  // Trigger emergency protocol
  const triggerSOS = async (type: string = "medical", speechText?: string) => {
    setSosActive(true);
    setShowWhatsAppModal(true);
    setActiveTab("protect");
    setHoldProgress(0);

    const currentLat = weatherCoords?.lat || 19.07604;
    const currentLng = weatherCoords?.lon || 72.87772;
    const activeLocationStr = user.address || (homeWeatherData?.location ? `${homeWeatherData.location.village || homeWeatherData.location.city}, IN` : `${currentLat.toFixed(4)}° N, ${currentLng.toFixed(4)}° E`);

    // Prepare offline logging if user is disconnected

    // Queue offline if user is currently disconnected
    if (!isOnline) {
      const newItem = {
        type: speechText ? `Voice: ${speechText}` : type,
        timestamp: new Date().toISOString(),
        location: activeLocationStr,
      };
      const updated = [...offlineQueue, newItem];
      localStorage.setItem("sahara_offline_queue", JSON.stringify(updated));
      setOfflineQueue(updated);
    }

    // Generate cryptographic verification data (Stellar / Solana style)
    const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const mockTxId = `tx_stellar_${Math.floor(Math.random() * 10000000000)}_${Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const mockBlock = Math.floor(2541090 + Math.random() * 10000);
    const mockMerkle = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    setBlockchainData({
      txId: mockTxId,
      blockNumber: mockBlock,
      hash: mockHash,
      merkleRoot: mockMerkle,
      timestamp: new Date().toISOString()
    });

    // Save dispatch request into localStorage for Responder Dashboard
    const newSOSRequest = {
      id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
      userName: user.name || "App User",
      userPhone: user.phone || "+91 98765 43210",
      userLocation: { lat: currentLat, lng: currentLng, address: activeLocationStr },
      type: type || "medical",
      status: "sent",
      responderName: "Dispatching...",
      responderVehicle: "Emergency Vehicle",
      responderLat: currentLat + 0.005,
      responderLng: currentLng + 0.005,
      eta: 4,
      distance: 1.2,
      timestamp: new Date().toLocaleTimeString() + " UTC",
      blockchainTxId: mockTxId
    };

    try {
      const existing = JSON.parse(localStorage.getItem("sahara_sos_history") || "[]");
      localStorage.setItem("sahara_sos_history", JSON.stringify([newSOSRequest, ...existing]));
    } catch (e) {}

    // Call server-side emergency coordinator
    try {
      const res = await fetch("/api/gemini/coordinate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyType: speechText ? "Voice Emergency" : type,
          userLocation: activeLocationStr,
          bloodType: user.bloodType,
          message: speechText || `Active SOS hold trigger fired. Type: ${type}`
        })
      });
      const data = await res.json();
      setSosPlan({
        severity: data.severity || "CRITICAL",
        dispatchVehicle: data.dispatchVehicle || "Ambulance 402",
        estimatedEta: data.estimatedEta || 4,
        actionSteps: data.actionSteps || [
          "Take slow, regulated breaths.",
          "Keep your screen active; GPS tracking beacon has locked your coordinate.",
          "Nearby volunteer responders in your Bluetooth mesh sector are heading your way."
        ],
        responderInstruction: data.responderInstruction || "Emergency: dispatch nearest Trauma team immediately.",
        reasoning: data.reasoning
      });
      setDynamicEta(data.estimatedEta || 4);
    } catch (err) {
      console.error("SOS Coordinator failure, using mesh fallbacks:", err);
      // Fallback
      const textToClassify = (speechText || type).toLowerCase();
      const contactName = user.emergencyContactName || "Emergency Contact";
      let fallbackPlan = {
        severity: "CRITICAL",
        dispatchVehicle: "Ambulance 402",
        estimatedEta: 4,
        actionSteps: [
          "Sit down and maintain your position.",
          `Relative ${contactName} has been notified automatically via IVR.`,
          "A volunteer from the active mesh network is moving to your coordinates."
        ],
        responderInstruction: `Urgent dispatch to Locked Coordinates. Blood group ${user.bloodType || "O+"}.`,
        reasoning: {
          detectedType: "Medical Emergency",
          indicators: ["Medical distress pattern", "No fire/hazard flags", "Priority 1 dispatch"],
          dispatching: ["Ambulance Unit 402", "Nearest Hospital", "Community First Responder"]
        }
      };

      if (textToClassify.includes("police") || textToClassify.includes("assault") || textToClassify.includes("robbery") || textToClassify.includes("security") || textToClassify.includes("danger") || textToClassify.includes("gunda") || textToClassify.includes("police force") || textToClassify.includes("fight")) {
        fallbackPlan = {
          severity: "CRITICAL",
          dispatchVehicle: "Police Patrol Car 108",
          estimatedEta: 5,
          actionSteps: [
            "Keep the phone silent and locked in a secure space.",
            "Control room has pinned your beacon coordinates on active police sector grid.",
            "Local emergency volunteers notified to assist."
          ],
          responderInstruction: `Security Threat: immediate intercept required. Approach target silently.`,
          reasoning: {
            detectedType: "Security Threat / Assault",
            indicators: ["Physical threat detected", "Silent dispatch enabled", "Control room PCR alerted"],
            dispatching: ["Patrol Car 108", "Police PCR Control", "Contact Circle"]
          }
        };
      } else if (textToClassify.includes("fire") || textToClassify.includes("gas") || textToClassify.includes("explosion") || textToClassify.includes("aag") || textToClassify.includes("dhuan")) {
        fallbackPlan = {
          severity: "CRITICAL",
          dispatchVehicle: "Fire Engine 55",
          estimatedEta: 6,
          actionSteps: [
            "Evacuate structures and move to an open public assembly point.",
            "Hydrant pressure locked via municipal sensor mesh.",
            "Fire Tender 55 en route with full response crew."
          ],
          responderInstruction: `Fire emergency alert: dispatch Engine 55 with hydromechanical apparatus.`,
          reasoning: {
            detectedType: "Fire & Hazmat Emergency",
            indicators: ["Fire / Smoke hazard reported", "Evacuation route active", "Sector station alert"],
            dispatching: ["Fire Engine 55", "Hazard Response Squad", "Mains Control"]
          }
        };
      } else if (textToClassify.includes("women") || textToClassify.includes("harassment") || textToClassify.includes("stalking") || textToClassify.includes("eve teasing") || textToClassify.includes("women safety")) {
        fallbackPlan = {
          severity: "HIGH",
          dispatchVehicle: "Helpline Intercept Patrol 12",
          estimatedEta: 4,
          actionSteps: [
            "Move toward high-visibility commercial areas or shops.",
            `Live companion tracker dispatched. Contact ${contactName} alert verified.`,
            "Camera stream ready. Press and hold volume keys to activate silent video capture."
          ],
          responderInstruction: `Women Safety escort: intercept at locked coords immediately. Active companion tracking.`,
          reasoning: {
            detectedType: "Women Safety & Escort Hazard",
            indicators: ["Harassment / unsafe route flag", "Live audio recording enabled", "Companion intercept requested"],
            dispatching: ["Helpline Patrol 12", "Female First Responders", "Decentralized Vault"]
          }
        };
      } else if (textToClassify.includes("farmer") || textToClassify.includes("agro") || textToClassify.includes("snake") || textToClassify.includes("crop") || textToClassify.includes("bite") || textToClassify.includes("sap") || textToClassify.includes("venom")) {
        fallbackPlan = {
          severity: "HIGH",
          dispatchVehicle: "Agri-Medic Unit",
          estimatedEta: 8,
          actionSteps: [
            "Remain completely calm and still. Immobilize the affected limb.",
            "Anti-venom stockpile verified at nearest rural community center.",
            "Rural volunteer network dispatched to locate and assist."
          ],
          responderInstruction: `Rural/farmer alert: dispatch anti-venom/first-aid and terrain buggy.`,
          reasoning: {
            detectedType: "Agricultural / Snake Bite Hazard",
            indicators: ["Rural emergency pattern matched", "Anti-venom protocol triggered", "Agri mesh notified"],
            dispatching: ["Agri-Medic Unit", "Rural First Responder", "Local Mesh"]
          }
        };
      } else if (textToClassify.includes("flood") || textToClassify.includes("disaster") || textToClassify.includes("storm") || textToClassify.includes("cyclone") || textToClassify.includes("water") || textToClassify.includes("rain")) {
        fallbackPlan = {
          severity: "CRITICAL",
          dispatchVehicle: "Rescue Boat Unit",
          estimatedEta: 12,
          actionSteps: [
            "Move to higher ground. Do not touch electrical outlets or enter moving water.",
            "Emergency beacon packet registered on Disaster frequency.",
            "Flood rescue team dispatched with inflatable rafts."
          ],
          responderInstruction: `Flood disaster active: dispatch rescue boat and life support kits.`,
          reasoning: {
            detectedType: "Flood & Disaster Hazard",
            indicators: ["Severe weather hazard", "Water level warning", "Evacuation route highlighted"],
            dispatching: ["Rescue Boat Unit", "Relief Squad", "High Elevation Shelter"]
          }
        };
      }

      setSosPlan(fallbackPlan);
      setDynamicEta(fallbackPlan.estimatedEta);
    }
  };

  const speakEmergencyConfirmation = (lang: "en" | "hi") => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const textEn = "Emergency request received. Please stay calm. Your location has been shared with your trusted contacts and nearby responders. Help is being coordinated.";
      const textHi = "आपातकालीन अनुरोध प्राप्त हुआ है। कृपया शांत रहें। आपकी स्थिति आपके विश्वसनीय संपर्कों और नजदीकी उत्तरदाताओं के साथ साझा की गई है। सहायता समन्वित की जा रही है।";
      const text = lang === "hi" ? textHi : textEn;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak failed:", e);
    }
  };

  // SOS button press handlers
  const startHold = () => {
    if (sosActive) return;
    isHoldingRef.current = true;
    setHoldProgress(0);
    holdProgressRef.current = 0;
    setShowCancelledPopup(false);

    // Speak initial safeguard prompt
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance("Keep holding to activate emergency mode.");
        utter.lang = "en-US";
        utter.rate = 1.05;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {}

    // Initial heartbeat and vibration thump
    playHeartbeatSound();
    if (navigator.vibrate) {
      navigator.vibrate([150, 50, 150]);
    }

    // Interval to repeat heartbeat sound and vibration every 1000ms
    heartbeatIntervalRef.current = setInterval(() => {
      if (isHoldingRef.current) {
        playHeartbeatSound();
        if (navigator.vibrate) {
          navigator.vibrate([180, 50, 180]);
        }
      }
    }, 1000);

    let stepMs = 100;
    let durationMs = 5000; // 5 seconds total
    let steps = durationMs / stepMs; // 50 steps

    // Progress interval (exactly 5000ms total, so 50 steps of 100ms)
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const nextProgress = prev + (100 / steps);
        holdProgressRef.current = nextProgress;
        
        if (nextProgress >= 100) {
          clearInterval(holdIntervalRef.current!);
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
          isHoldingRef.current = false;
          setShowCancelledPopup(false);
          
          // Successful SOS trigger - Vibrate device
          if (navigator.vibrate) {
            navigator.vibrate([600, 200, 600, 200, 600]);
          }
          
          // Play emergency alert sound for 2 seconds
          startEmergencySiren();
          setTimeout(() => {
            stopEmergencySiren();
          }, 2000);

          // Show success toast "Emergency request sent successfully."
          setSosSuccessToast(true);
          setTimeout(() => {
            setSosSuccessToast(false);
          }, 5000);

          // 1.5-second Loading screen: "Activating Emergency Protocol..."
          setDashboardLoadingText("Activating Emergency Protocol...");
          setShowDashboardLoading(true);

          setTimeout(() => {
            setShowDashboardLoading(false);
            setHoldProgress(0);
            holdProgressRef.current = 0;
            setShowVoiceSystem(true);
          }, 1500);

          return 100;
        }
        return nextProgress;
      });
    }, stepMs);
  };

  const endHold = () => {
    if (!isHoldingRef.current) return;
    
    isHoldingRef.current = false;
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (holdProgressRef.current < 100) {
      // Released before 5 seconds: Cancel SOS request immediately
      setHoldProgress(0);
      holdProgressRef.current = 0;
      setShowCancelledPopup(true);
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance("Emergency hold cancelled.");
          utter.lang = "en-US";
          window.speechSynthesis.speak(utter);
        }
      } catch (e) {}
      setTimeout(() => {
        setShowCancelledPopup(false);
      }, 3000);
    }
  };

  // Translations compat layer
  const t = (key: string) => {
    if (key === "greeting") {
      return globalT("dashboard.greetingMorning", { name: user.name });
    }
    const legacyMap: Record<string, string> = {
      status: "dashboard.currentStatus",
      safetyScore: "dashboard.safetyScore",
      activeSos: "dashboard.activeSos",
      holdLabel: "dashboard.holdLabel",
      medical: "emergency.medical",
      medicalDesc: "emergency.medicalDesc",
      police: "emergency.police",
      policeDesc: "emergency.policeDesc",
      fire: "emergency.fire",
      fireDesc: "emergency.fireDesc",
      women: "emergency.women",
      womenDesc: "emergency.womenDesc",
      farmer: "emergency.farmer",
      farmerDesc: "emergency.farmerDesc",
      assistant: "dashboard.activeAssistant",
      assistantQuery: "dashboard.assistantQuery",
      nearby: "dashboard.nearbyServices",
      viewMap: "dashboard.viewMap"
    };

    if (key in legacyMap) {
      return globalT(legacyMap[key]);
    }
    return globalT(key);
  };

  const handleSplashComplete = useCallback(() => {
    try {
      const cached = localStorage.getItem("sahara_current_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id !== "GUEST") {
          setScreen("dashboard");
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached user on splash complete:", e);
    }
    setScreen("onboarding");
  }, []);

  return (
    <div className={`min-h-screen ${user.theme === "dark" ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-800"}`}>
      
      {/* 1. SPLASH SCREEN */}
      {screen === "splash" && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* 2. ONBOARDING */}
      {screen === "onboarding" && (
        <Onboarding onComplete={() => setScreen("landing")} />
      )}

      {/* 3. EMERGENCY LANDING PAGE */}
      {screen === "landing" && (
        <EmergencyLandingPage 
          onTriggerSOS={() => setScreen("guest_sos")} 
          onGoToAuth={() => {
            setAuthInitialMode("login");
            setAuthCancelRedirect("landing");
            setScreen("auth");
          }} 
        />
      )}

      {/* 4. GUEST EMERGENCY MODE */}
      {screen === "guest_sos" && (
        <GuestEmergencyMode 
          onCancel={() => setScreen("landing")}
          onSOSDispatched={(data) => {
            const guestUser: UserProfile = {
              ...GUEST_PROFILE,
              phone: data.phone !== "Not Shared" ? data.phone : "",
              healthNotes: `Guest bypass protocol. Category: ${data.type}. Voice transcription: ${data.voiceText}.`
            };
            setUser(guestUser);
            if (data.redirectTo === "register" || data.redirectTo === "login") {
              setAuthInitialMode(data.redirectTo);
              setAuthCancelRedirect("dashboard");
              setScreen("auth");
            } else {
              setScreen("dashboard");
            }
            // GuestEmergencyMode has completed dispatch; navigate without re-executing triggerSOS
          }}
        />
      )}

      {/* 5. AUTHENTICATION */}
      {screen === "auth" && (
        <AuthScreen 
          initialMode={authInitialMode}
          onLoginSuccess={handleLoginSuccess} 
          onCancel={() => setScreen(authCancelRedirect)}
        />
      )}

      {/* 6. MAIN DASHBOARD HUB */}
      {screen === "dashboard" && (
        <div className="dashboard-site-shell flex flex-col min-h-screen relative pb-20">
          
          {showSentOverlay && (
            <div className="fixed inset-0 bg-red-950/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center space-y-6 text-white animate-fade-in">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-44 h-44 bg-red-500/20 rounded-full animate-ping" />
                <div className="absolute w-36 h-36 bg-red-600/30 rounded-full animate-pulse" />
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.8)] border-4 border-white">
                  <ShieldAlert className="w-12 h-12 text-white animate-bounce" />
                </div>
              </div>
              
              <div className="text-center space-y-2 px-6">
                <h2 className="text-2xl font-sans font-black tracking-tight text-white uppercase animate-pulse">
                  Emergency Request Sent
                </h2>
                <p className="text-xs text-red-300 max-w-[320px] mx-auto font-medium">
                  Broadcasting live telemetry coordinates over decentralized satellite mesh. Emergency response has been initiated.
                </p>
              </div>

              <div className="flex gap-2 bg-red-900/50 border border-red-500/30 px-3 py-1.5 rounded-full items-center">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span className="text-[9px] text-red-200 font-mono tracking-widest uppercase">
                  SIREN & GPS CHANNELS BROADCAST ACTIVE
                </span>
              </div>
            </div>
          )}

          {sosSuccessToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 border border-emerald-400 text-white px-6 py-3.5 rounded-2xl shadow-2xl font-sans text-xs font-bold flex items-center gap-2.5 animate-bounce">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-100" />
              <span>Emergency request sent successfully.</span>
            </div>
          )}

          {showCancelledPopup && !sosSuccessToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-600 border border-red-400 text-white px-6 py-3 rounded-2xl shadow-2xl font-sans text-xs font-bold flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>SOS Cancelled</span>
            </div>
          )}

          {holdProgress > 0 && holdProgress < 100 && (
            <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-[99] flex flex-col items-center justify-center space-y-6 text-white animate-fade-in">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-40 h-40 bg-red-500/20 rounded-full animate-ping" />
                <div className="absolute w-32 h-32 bg-red-600/30 rounded-full animate-pulse" />
                <div className="w-24 h-24 bg-red-600 rounded-full flex flex-col items-center justify-center text-5xl font-sans font-black shadow-[0_0_50px_rgba(239,68,68,0.7)] border-2 border-white/20">
                  {Math.max(1, Math.ceil(5 - (holdProgress / 100) * 5))}
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-sm font-sans font-black tracking-wider uppercase text-red-400">HOLD FOR 5 SECONDS TO ACTIVATE SOS</h3>
                <p className="text-[10px] text-gray-300 font-medium font-mono">RELEASE BEFORE 5 SECONDS TO CANCEL REQUEST</p>
              </div>

              <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-red-500 transition-all duration-75" style={{ width: `${holdProgress}%` }} />
              </div>

              <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">DISPATCH PROTOCOL READY</p>
            </div>
          )}
          
          {/* Top AppBar */}
          <header className="dashboard-site-header fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 h-16 border-b border-white/10 bg-[#0F111A]/90 backdrop-blur-md text-[#E0E2E7] shrink-0">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/20 shrink-0">
                <span className="text-xl font-bold text-white tracking-tighter">S</span>
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2 leading-none">
                  SAHARA <span className="text-orange-500 text-[10px] font-mono">v1.0.4-PROD</span>
                  {isDemoMode && (
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                      [DEMO]
                    </span>
                  )}
                </h1>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest font-semibold mt-1 hidden sm:block">
                  Emergency Response Network
                </p>
              </div>
            </div>

            {/* Quick Profile & Controls */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end leading-none gap-0.5">
                <span className="text-[10px] font-mono text-green-400">MESH NETWORK ACTIVE</span>
                <span className="text-[9px] text-gray-500">32 PEERS [Demo]</span>
              </div>

              {/* Demo Mode Toggle Button */}
              <button
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={`px-2.5 h-8 rounded-lg border font-mono text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isDemoMode
                    ? "bg-amber-500/25 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
                title="Toggle Demo Fast Timeline Mode"
              >
                <span>⚡ {isDemoMode ? "Demo Fast" : "Demo Mode"}</span>
              </button>

              {/* Smartwatch Simulator Toggle */}
              <button 
                onClick={() => {
                  setShowWatchSimulator(prev => !prev);
                  try {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const utter = new SpeechSynthesisUtterance(showWatchSimulator ? "Smartwatch simulator closed." : "Smartwatch simulator companion connected.");
                      utter.lang = "en-US";
                      window.speechSynthesis.speak(utter);
                    }
                  } catch (e) {}
                }}
                className={`px-2.5 h-8 rounded-lg border font-mono text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  showWatchSimulator 
                    ? "bg-orange-600/25 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]" 
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
                title="Open Smartwatch Companion Simulator"
              >
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping shrink-0" />
                <span>⌚ Watch Sim</span>
              </button>

              {/* Language Switch */}
              <button 
                onClick={() => setLanguage(language === "en" ? "hi" : "en")}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-xs font-bold transition-all cursor-pointer hover:bg-white/10 text-white"
                title="Switch Language (English / हिंदी)"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setUser(prev => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" }))}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center transition-all cursor-pointer hover:bg-white/10 text-orange-500"
                title="Toggle Light/Dark Theme"
              >
                {user.theme === "dark" ? <Sun className="w-3.5 h-3.5 text-orange-500" /> : <Moon className="w-3.5 h-3.5 text-gray-400" />}
              </button>

              {/* Profile Logo Button in Top Header */}
              <button 
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all cursor-pointer shadow-md group"
                title="Open Profile & Digital Health ID"
              >
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-orange-500/80 shrink-0">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform" src={user.avatar} alt={user.name} />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black" />
                </div>
                <span className="text-[10px] font-bold text-white hidden sm:inline-block max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
              </button>
            </div>
          </header>

          {/* MAIN PAGE BODY (Scrollable contents) */}
          <main className="dashboard-site-main pt-20 px-4 sm:px-6 lg:px-10 xl:px-14 w-full space-y-6">

            {!isOnline && (
              <div id="offline-banner" className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-mono flex items-center justify-between gap-3 animate-pulse">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  OFFLINE MESH MODE ACTIVE — Queueing SOS packets locally.
                </span>
                <span className="bg-amber-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                  {offlineQueue.length} Queued
                </span>
              </div>
            )}

            {showSyncSuccess && (
              <div id="sync-success-banner" className="p-3.5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-mono flex flex-col gap-1 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    MESH DISPATCH OUTBOX SYNCHRONIZED
                  </span>
                  <button onClick={() => setShowSyncSuccess(false)} className="text-gray-400 hover:text-white font-sans text-xs">×</button>
                </div>
                <p className="text-[9px] text-gray-400 font-sans leading-relaxed">
                  Decentralized nodes successfully committed pending receipts. All regional dispatches have been broadcast to active field beacons.
                </p>
              </div>
            )}
            
            {/* TAB A: HOME DASHBOARD */}
            {activeTab === "home" && (
              <div className="dashboard-home-grid space-y-6 animate-fade-in pb-10">
                
                {/* PROMINENT PROFILE LOGO CARD AT TOP OF HOME PAGE */}
                <section 
                  onClick={() => setActiveTab("profile")}
                  className="dashboard-home-profile bg-gradient-to-r from-[#161923] via-[#1C2030] to-[#161923] border border-white/10 hover:border-orange-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500/80 shadow-md shrink-0">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={user.avatar} alt={user.name} />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161923] animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">{user.name}</h3>
                        <span className="text-[9px] bg-orange-600/20 border border-orange-500/30 text-orange-400 px-1.5 py-0.2 rounded font-mono font-bold">
                          {user.bloodType}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Health ID: <span className="text-gray-200 font-semibold">{user.healthId}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono font-bold bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                    <User className="w-3.5 h-3.5" />
                    <span>Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </section>

                {/* User greeting & Scoreboard */}
                <section className="dashboard-home-greeting flex justify-between items-end pt-1">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">{t("status")}</span>
                    <h2 className="font-sans text-2xl font-black tracking-tight">{t("greeting")}</h2>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 text-blue-600 font-extrabold text-xl leading-none justify-end">
                      <span>{user.safetyScore}</span>
                      <span className="text-[10px] text-neutral-400 font-medium">/100</span>
                    </div>
                    <span className="font-mono text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{t("safetyScore")}</span>
                  </div>
                </section>

                 {/* Elderly Mode Quick Toggle and Info Alert */}
                <div className="dashboard-home-elderly flex justify-between items-center bg-white/5 border border-white/5 rounded-2xl p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight">Elderly Mode</h4>
                      <p className="text-[9px] text-neutral-400 mt-0.5">Bypasses the 10-second hold requirement.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsElderlyMode(!isElderlyMode);
                      try {
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const msg = isElderlyMode ? "Elderly tap mode deactivated." : "Elderly tap mode activated. Single touch to trigger help.";
                          window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
                        }
                      } catch (e) {}
                    }}
                    className={`px-3 py-1 rounded-xl border text-[10px] font-mono font-black transition-all cursor-pointer ${
                      isElderlyMode 
                        ? "bg-amber-600/20 border-amber-500 text-amber-400" 
                        : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10"
                    }`}
                  >
                    {isElderlyMode ? "ACTIVE (TAP)" : "DISABLED"}
                  </button>
                </div>

                {/* Massive Interactive SOS Pulsing Action Button */}
                <section className="dashboard-home-sos relative flex flex-col items-center justify-center py-6">
                  {/* Concentric ripples (activated dynamically) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`rounded-full bg-red-500/10 ${sosActive ? 'animate-sos-pulse w-56 h-56' : 'w-44 h-44 animate-pulse-soft'}`} />
                    <div className={`rounded-full bg-red-500/5 ${sosActive ? 'animate-sos-pulse w-72 h-72' : 'w-56 h-56'}`} style={{ animationDelay: "0.5s" }} />
                  </div>

                  <button
                    onMouseDown={isElderlyMode ? undefined : startHold}
                    onMouseUp={isElderlyMode ? undefined : endHold}
                    onMouseLeave={isElderlyMode ? undefined : endHold}
                    onTouchStart={isElderlyMode ? undefined : (e) => { e.preventDefault(); startHold(); }}
                    onTouchEnd={isElderlyMode ? undefined : endHold}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isElderlyMode) {
                        try {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Confirm emergency dispatcher request."));
                          }
                        } catch (err) {}
                        setShowElderlyConfirm(true);
                      }
                    }}
                    className={`relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer ${
                      sosActive 
                        ? "bg-red-800 text-white shadow-[0_0_30px_rgba(186,26,26,0.5)] animate-pulse" 
                        : holdProgress > 0 
                          ? "bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse scale-105"
                          : isElderlyMode 
                            ? "bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-[0_0_25px_rgba(230,57,70,0.4)] animate-bounce"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_16px_rgba(230,57,70,0.35)]"
                    }`}
                  >
                    {holdProgress > 0 ? (
                      <div className="text-center">
                        <span className="font-sans text-4xl font-black text-white leading-none">
                          {Math.max(1, Math.ceil(5 - (holdProgress / 100) * 5))}
                        </span>
                        <span className="text-[9px] font-mono font-bold block uppercase tracking-widest text-white/80 mt-1">HOLD</span>
                      </div>
                    ) : (
                      <>
                        <HeartPulse className="w-12 h-12 text-white animate-pulse" />
                        <span className="font-sans text-3xl font-black tracking-tighter">SOS</span>
                      </>
                    )}

                    {/* Circular hold timer ring */}
                    {holdProgress > 0 && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                          cx="72"
                          cy="72"
                          r="68"
                          fill="none"
                          stroke="white"
                          strokeWidth="6"
                          strokeDasharray="427"
                          strokeDashoffset={427 - (427 * holdProgress) / 100}
                          className="transition-all duration-75"
                        />
                      </svg>
                    )}
                  </button>

                  <p className="mt-6 font-mono text-[10px] font-bold text-neutral-400 tracking-wider uppercase text-center">
                    {sosActive 
                      ? t("activeSos") 
                      : isElderlyMode 
                        ? "SINGLE TAP TO ACTIVATE SOS" 
                        : t("holdLabel")}
                  </p>
                </section>

                {/* Quick actions Bento grids */}
                <section className="dashboard-home-actions grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => triggerSOS("medical")}
                    className="relative rounded-2xl p-4 cursor-pointer overflow-hidden group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#fff5f5,#fff)", border: "1px solid #fecaca", boxShadow: "0 4px 20px rgba(239,68,68,0.08)" }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl" />
                    <span className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-lg shadow-lg shadow-red-500/30 mb-3 block" style={{ boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>🚑</span>
                    <div>
                      <h3 className="font-bold text-xs text-neutral-800">{t("medical")}</h3>
                      <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{t("medicalDesc")}</p>
                    </div>
                    <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-3 h-3 text-red-500" />
                    </div>
                  </div>

                  <div 
                    onClick={() => triggerSOS("police")}
                    className="relative rounded-2xl p-4 cursor-pointer overflow-hidden group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#eff6ff,#fff)", border: "1px solid #bfdbfe", boxShadow: "0 4px 20px rgba(59,130,246,0.08)" }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
                    <span className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-lg shadow-lg mb-3 block" style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>🚔</span>
                    <div>
                      <h3 className="font-bold text-xs text-neutral-800">{t("police")}</h3>
                      <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{t("policeDesc")}</p>
                    </div>
                    <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>

                  <div 
                    onClick={() => triggerSOS("fire")}
                    className="relative rounded-2xl p-4 cursor-pointer overflow-hidden group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#fffbeb,#fff)", border: "1px solid #fde68a", boxShadow: "0 4px 20px rgba(245,158,11,0.08)" }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-2xl" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                    <span className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-lg shadow-lg mb-3 block" style={{ boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>🚒</span>
                    <div>
                      <h3 className="font-bold text-xs text-neutral-800">{t("fire")}</h3>
                      <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{t("fireDesc")}</p>
                    </div>
                    <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                    </div>
                  </div>

                  <div 
                    onClick={() => triggerSOS("women_safety")}
                    className="relative rounded-2xl p-4 cursor-pointer overflow-hidden group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#fdf4ff,#fff)", border: "1px solid #e9d5ff", boxShadow: "0 4px 20px rgba(147,51,234,0.08)" }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl" />
                    <span className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-lg shadow-lg mb-3 block" style={{ boxShadow: "0 4px 12px rgba(147,51,234,0.3)" }}>👩</span>
                    <div>
                      <h3 className="font-bold text-xs text-neutral-800">{t("women")}</h3>
                      <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{t("womenDesc")}</p>
                    </div>
                    <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-3 h-3 text-purple-500" />
                    </div>
                  </div>

                  {/* Farmer Emergency full bento width */}
                  <div 
                    onClick={() => triggerSOS("farmer")}
                    className="col-span-2 relative rounded-2xl p-4 cursor-pointer overflow-hidden group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
                    style={{ background: "linear-gradient(135deg,#f0fdf4,#fff)", border: "1px solid #bbf7d0", boxShadow: "0 4px 20px rgba(16,185,129,0.08)" }}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                    <div className="flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-xl shadow-lg" style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.35)" }}>🌾</span>
                      <div>
                        <h3 className="font-bold text-xs text-neutral-800">{t("farmer")}</h3>
                        <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{t("farmerDesc")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-mono text-[9px] font-bold uppercase tracking-wide opacity-60 group-hover:opacity-100 transition-opacity">
                      <span>Alert</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </section>

                {/* LIVE LOCATION-BASED WEATHER FORECAST SYSTEM COMPACT CARD */}
                <section 
                  className="dashboard-home-weather glass-panel p-5 rounded-2xl shadow-sm hover:scale-[1.01] hover:bg-neutral-50/15 transition-all cursor-pointer relative overflow-hidden group bg-gradient-to-r from-blue-500/5 to-sky-500/5 border border-blue-500/10"
                  onClick={() => setShowWeatherDashboard(true)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        Live GPS Weather Radar
                      </span>
                      {weatherLoading ? (
                        <div className="h-5 w-28 bg-neutral-200/20 animate-pulse rounded mt-1" />
                      ) : homeWeatherData ? (
                        <h4 className="font-sans text-sm font-black text-neutral-800 flex items-center gap-1 mt-1">
                          📍 {homeWeatherData.location.village || homeWeatherData.location.city || "My Location"}
                        </h4>
                      ) : (
                        <h4 className="font-sans text-sm font-black text-neutral-800 flex items-center gap-1 mt-1">📍 Enable Live Weather</h4>
                      )}
                      
                      {homeWeatherData ? (
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-2xl font-black text-neutral-800 tracking-tight">
                            {homeWeatherData.current.temp}°C
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200/50">
                            <span>{homeWeatherData.current.conditionIcon}</span>
                            <span>{homeWeatherData.current.conditionText}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-neutral-400 mt-1 font-semibold">Tap to lock live location and fetch local forecasts.</p>
                      )}
                    </div>

                    {homeWeatherData && (
                      <div className="text-right space-y-1 shrink-0 font-mono text-[9px] text-neutral-400 font-extrabold">
                        <span className="block">💧 {homeWeatherData.current.humidity}% Humidity</span>
                        <span className="block">💨 {homeWeatherData.current.windSpeed} km/h Wind</span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Alert Banner or Farmer Advisory inside compact card */}
                  {homeWeatherData && homeWeatherData.alerts && homeWeatherData.alerts.length > 0 ? (
                    <div className="mt-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-red-500 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>CRITICAL: {homeWeatherData.alerts[0].type} active in sector!</span>
                    </div>
                  ) : homeWeatherData && homeWeatherData.farmerAdvisories && homeWeatherData.farmerAdvisories.length > 0 ? (
                    <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-emerald-600">
                      <span>🌾 Krishi Alert:</span>
                      <span className="truncate font-semibold text-slate-600">{homeWeatherData.farmerAdvisories[0].message}</span>
                    </div>
                  ) : null}
                </section>

                {/* COMMUNITY IMPACT SYSTEM COMPACT SUMMARY CARD */}
                <section 
                  className="dashboard-home-community glass-panel p-5 rounded-2xl shadow-sm hover:scale-[1.01] hover:bg-neutral-50/15 transition-all cursor-pointer relative overflow-hidden group bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10"
                  onClick={() => {
                    if (!checkGuestRestriction("Save Emergency History")) {
                      setActiveTab("history");
                      setActiveOverlay(null);
                    }
                  }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        <Award className="w-3.5 h-3.5" />
                        Community Impact & Recognition
                      </span>
                      <h4 className="font-sans text-sm font-black text-neutral-800 flex items-center gap-1 mt-1">
                        🏆 Citizen Rank: #{user.villageScore || 3} in Village
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 font-sans text-[11px] text-neutral-500 font-bold">
                        <div>⭐ Rep Score: <span className="font-mono text-neutral-900 font-black">{user.credits || 780} pts</span></div>
                        <div>❤️ Lives Helped: <span className="font-mono text-neutral-900 font-black">14 Saved [Demo]</span></div>
                        <div>🚨 Dispatch runs: <span className="font-mono text-neutral-900 font-black">9 Runs [Demo]</span></div>
                        <div>🩸 Blood Donated: <span className="font-mono text-neutral-900 font-black">4 Units [Demo]</span></div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1 shrink-0 font-mono text-[9px] font-extrabold">
                      <span className="block text-white bg-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500 font-sans shadow-sm">
                        Top 2% District [Demo]
                      </span>
                      <span className="block mt-1 font-sans text-slate-500">🤝 42 hrs active</span>
                    </div>
                  </div>
                </section>

                {/* AI Safety Active Assistant Card */}
                <section 
                  className="dashboard-home-assistant glass-panel p-5 rounded-2xl shadow-sm hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group"
                  onClick={() => setActiveTab("explore")}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 shimmer" />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-blue-500/50 shadow-md animate-orb-breathing" style={{ boxShadow: "0 0 16px rgba(59,130,246,0.3)" }}>
                      <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=120&h=120&q=80" alt="AI Sphere" onError={(e) => { const t=e.currentTarget; t.onerror=null; t.src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=120&h=120&q=80"; }} />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-widest">{t("assistant")}</span>
                      <h4 className="font-bold text-sm text-neutral-800">{t("assistantQuery")}</h4>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-800 hover:text-white rounded-full text-[10px] font-semibold text-neutral-600 transition-colors">
                          "Check my heart rate"
                        </span>
                        <span className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-800 hover:text-white rounded-full text-[10px] font-semibold text-neutral-600 transition-colors">
                          "Get safe directions"
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="dashboard-home-coordinator coordinator-section">
                  <div className="coordinator-section-heading">
                    <div>
                      <span className="coordinator-eyebrow">Advanced coordinator capabilities</span>
                      <h3>One network. Every response connected.</h3>
                      <p>Bring family safety, early warnings, volunteers, and dispatch together.</p>
                    </div>
                    <span className="coordinator-live-pill"><span />4 connected tools</span>
                  </div>
                  <div className="coordinator-card-scene">
                    <div className="coordinator-feature-card">
                      <div className="coordinator-card-art">
                        <img src={coordinatorNetworkArt} alt="Emergency coordinator connecting a rescue team and nearby community" />
                        <div className="coordinator-art-caption">
                          <span className="coordinator-art-pulse" />
                          Live response network
                        </div>
                      </div>
                      <div className="coordinator-card-content">
                        <span className="coordinator-card-kicker">SAHARA COORDINATOR</span>
                        <h4>Turn alerts into coordinated action.</h4>
                        <p>Keep the people, information, and response teams you rely on within reach.</p>
                        <div className="coordinator-action-grid">
                          <button
                            onClick={() => {
                              if (!checkGuestRestriction("Save Family Members")) {
                                setActiveOverlay("family");
                              }
                            }}
                            className="coordinator-action"
                          >
                            <span className="coordinator-action-icon"><Users /></span>
                            <span><strong>Family tracker</strong><small>Keep your circle close</small></span>
                            <ArrowUpRight className="coordinator-action-arrow" />
                          </button>
                          <button onClick={() => setActiveOverlay("disaster")} className="coordinator-action">
                            <span className="coordinator-action-icon"><CloudLightning /></span>
                            <span><strong>Predictive alerts</strong><small>See local risk signals</small></span>
                            <ArrowUpRight className="coordinator-action-arrow" />
                          </button>
                          <button
                            onClick={() => {
                              if (!checkGuestRestriction("Join Volunteer Program")) {
                                setActiveOverlay("volunteer");
                              }
                            }}
                            className="coordinator-action"
                          >
                            <span className="coordinator-action-icon"><ShieldCheck /></span>
                            <span><strong>Volunteer portal</strong><small>Mobilize nearby helpers</small></span>
                            <ArrowUpRight className="coordinator-action-arrow" />
                          </button>
                          <button
                            onClick={() => {
                              if (!checkGuestRestriction("Admin Dashboard")) {
                                setActiveOverlay("admin");
                              }
                            }}
                            className="coordinator-action"
                          >
                            <span className="coordinator-action-icon"><Truck /></span>
                            <span><strong>Dispatch dashboard</strong><small>Coordinate response teams</small></span>
                            <ArrowUpRight className="coordinator-action-arrow" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Nearby Medical Resources List */}
                <section className="dashboard-home-nearby space-y-4 pt-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-neutral-500" />
                      {t("nearby")}
                    </h3>
                    <button onClick={() => setActiveTab("protect")} className="text-blue-600 text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer">
                      {t("viewMap")}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Hospital Card */}
                    <div className="glass-panel p-3.5 rounded-xl flex gap-4 items-center shadow-sm">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-inner">
                        <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=120&h=120&q=80" alt="Medical facility" onError={(e) => { const t=e.currentTarget; t.onerror=null; t.src="https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?auto=format&fit=crop&w=120&h=120&q=80"; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-neutral-800 truncate">Apollo Hospital</h4>
                        <div className="flex items-center gap-1 text-neutral-400 text-[10px] font-mono mt-0.5">
                          <span>1.2 km</span>
                          <span>•</span>
                          <span className="text-red-500 font-bold">4 mins ETA</span>
                        </div>
                      </div>
                      <a href="tel:+919876543210" className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Blood Bank Card */}
                    <div className="glass-panel p-3.5 rounded-xl flex gap-4 items-center shadow-sm">
                      <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <span>🩸</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-neutral-800 truncate">City Blood Bank</h4>
                        <p className="text-neutral-400 text-[10px] font-mono mt-0.5">O+ and A- stocks secured</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded font-mono uppercase tracking-wider">
                        OPEN
                      </span>
                    </div>
                  </div>
                </section>

              </div>
            )}

            {/* TAB B: EXPLORE AI ASSISTANT CHAT */}
            {activeTab === "explore" && (
              <VoiceAssistant />
            )}

            {/* TAB C: LIVE COORDINATOR TRACKING MAP */}
            {activeTab === "protect" && (
              <div className="protect-page-shell animate-fade-in pb-10">
                <section className="protect-page-hero">
                  <div className="protect-hero-copy">
                    <span className="protect-page-eyebrow"><MapPin /> LIVE SAFETY NETWORK</span>
                    <h2>Know where you are.<br /><span>Know help is connected.</span></h2>
                    <p>See your current GPS position, keep your safety beacon in view, and follow response coordination when you need it.</p>
                    <div className="protect-hero-status">
                      <span><i /> Location-aware map</span>
                      <span><ShieldCheck /> Private location controls</span>
                    </div>
                  </div>
                  <div className="protect-hero-art">
                    <img src={protectMapArt} alt="Illustrated neighborhood map with a live emergency location pin" />
                    <div className="protect-art-badge"><span /> SAHARA RESPONSE NETWORK</div>
                  </div>
                </section>
                
                {/* Floating Top Audio relay indicators */}
                <div className="protect-agent-status glass-panel rounded-2xl p-4 flex items-center gap-4 shadow-md border border-neutral-100">
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center relative overflow-hidden">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                    <Activity className="w-4 h-4 text-white relative z-10 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[8px] font-bold text-neutral-400 uppercase tracking-widest block">SAHARA AI AGENT</span>
                    <p className="text-xs font-semibold text-neutral-800 truncate italic">
                      {sosActive ? '"Broadcasting medical profile to responder Jenkins..."' : '"Guardian Beacon Active. Lock precise GPS coordinates below."'}
                    </p>
                  </div>
                </div>

                {/* Leaflet Map Component */}
                <div className="protect-live-map w-full rounded-2xl overflow-hidden shadow-md">
                  <MapComponent 
                    responderActive={sosActive} 
                    responderStatus={sosActive ? "en_route" : "sent"}
                    emergencyType={sosActive ? "flood" : "medical"}
                    theme={user.theme}
                    onEtaUpdate={(eta, dist) => {
                      setDynamicEta(eta);
                      setDynamicDistance(dist);
                    }}
                  />
                </div>

                {/* Timeline Progress Indicators (only if SOS is triggered) */}
                {sosActive ? (
                  <div className="protect-dispatch-details space-y-4">
                    {/* Live Tracking Information Card */}
                    <div className="glass-panel rounded-2xl p-5 shadow-lg border border-white/10 space-y-4 bg-neutral-900/40 text-white">
                      
                      {/* Arrival ETA header */}
                      <div className="flex justify-between items-end border-b border-white/5 pb-3">
                        <div>
                          <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest block font-extrabold">Active Incident Dispatch</span>
                          <h3 className="font-sans text-base font-black text-white leading-tight mt-0.5">
                            Rescue arriving in <span className="text-red-500 font-extrabold animate-pulse">{dynamicEta} mins</span>
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-neutral-200 block">{dynamicDistance} km away</span>
                          <span className="font-mono text-[9px] text-red-500 font-extrabold uppercase animate-pulse">Mesh Broadcast Active</span>
                        </div>
                      </div>

                      {/* Storytelling Reassurance Banner */}
                      <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-amber-500/20 border border-orange-500/30 p-3.5 rounded-xl text-center shadow-inner">
                        <p className="text-xs font-black text-amber-300 font-sans tracking-wide">
                          "Help is being coordinated. Stay calm. You are not alone."
                        </p>
                      </div>

                      {/* Responder Assignment block */}
                      <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                        <span className="font-mono text-[8px] font-bold text-neutral-400 uppercase tracking-widest block">ASSIGNED RESPONDER VEHICLE</span>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🚑</span>
                            <div>
                              <p className="text-xs font-black text-white">{sosPlan?.dispatchVehicle || "Ambulance 402"}</p>
                              <p className="text-[9px] text-neutral-400 font-medium font-mono uppercase">Severity: {sosPlan?.severity || "CRITICAL"}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[9px] font-extrabold rounded-full uppercase tracking-wider animate-pulse">
                            EN ROUTE
                          </span>
                        </div>
                      </div>

                      {/* AI Reasoning Analysis Card */}
                      {sosPlan?.reasoning && (
                        <div className="p-3.5 bg-blue-950/40 border border-blue-500/20 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[8px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                              AI Clinical Reasoning & Triage Engine
                            </span>
                            <span className="text-[8px] font-mono font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded">
                              {sosPlan.reasoning.detectedType}
                            </span>
                          </div>
                          <div className="space-y-1 text-[10px] text-neutral-300 leading-relaxed font-sans">
                            <span className="text-[9px] text-neutral-400 font-mono uppercase font-bold block">Key Detected Signals:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {sosPlan.reasoning.indicators.map((ind: string, idx: number) => (
                                <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] text-blue-200">
                                  • {ind}
                                </span>
                              ))}
                            </div>
                            {sosPlan.reasoning.dispatching && (
                              <p className="text-[9px] text-neutral-400 font-mono pt-1">
                                <span className="text-blue-400 font-bold">Target Outlets: </span>
                                {sosPlan.reasoning.dispatching.join(" → ")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dynamic Response Flow / First Aid Guidelines */}
                      {sosPlan?.actionSteps && (
                        <div className="space-y-2 pt-1">
                          <span className="font-mono text-[8px] font-bold text-neutral-400 uppercase tracking-widest block">CRITICAL FIRST-RESPONSE PROTOCOLS</span>
                          <div className="space-y-2">
                            {sosPlan.actionSteps.map((step, idx) => (
                              <div key={idx} className="flex gap-2.5 items-start text-[10px] leading-relaxed text-neutral-300 font-medium bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-emerald-500 font-extrabold mt-0.5 shrink-0">✓</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Premium Animated 8-Phase Emergency Timeline */}
                      <div className="space-y-3.5 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[8px] font-bold text-neutral-400 uppercase tracking-widest block">EMERGENCY TELEMETRY TIMELINE</span>
                          <span className="flex items-center gap-1 font-mono text-[8px] text-orange-500 font-extrabold animate-pulse uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                            Phase {sosPhase}/8 Active
                          </span>
                        </div>
                        
                        <div className="space-y-3.5">
                          {[
                            { phase: 1, title: "Emergency Received", desc: "Encrypted distress packet signed and broadcast over mesh network." },
                            { phase: 2, title: "AI Analysis Complete", desc: "Severity categorized and clinical triage reasoning generated." },
                            { phase: 3, title: "Finding Responders", desc: "Locating nearest verified peer nodes in immediate sector." },
                            { phase: 4, title: "Finding Hospital", desc: "Pinging local trauma centers for available ER bed & ICU capacity." },
                            { phase: 5, title: "Finding Volunteers", desc: "Alerting local neighborhood first-responders within 500m radius." },
                            { phase: 6, title: "Creating Record", desc: "Securing cryptographically verified immutable record on-chain." },
                            { phase: 7, title: "Dispatch Complete", desc: `${sosPlan?.dispatchVehicle || "Ambulance 402"} confirmed vehicle vector assignment.` },
                            { phase: 8, title: "Help On The Way", desc: `Arriving in ~${dynamicEta} mins (${dynamicDistance.toFixed(1)} km away).` },
                          ].map((item) => {
                            const isDone = sosPhase > item.phase;
                            const isCurrent = sosPhase === item.phase;
                            return (
                              <div key={item.phase} className="flex items-start gap-3 relative pl-6">
                                {item.phase < 8 && (
                                  <div className={`absolute left-[9px] top-4 bottom-[-16px] w-[2px] ${isDone ? "bg-emerald-500/40" : "bg-white/10"}`} />
                                )}
                                <div className="absolute left-0 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all">
                                  {isDone ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-sans">✓</div>
                                  ) : isCurrent ? (
                                    <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400 flex items-center justify-center animate-pulse">●</div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-500 flex items-center justify-center font-sans text-[9px]">{item.phase}</div>
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className={`text-xs font-bold ${isDone || isCurrent ? "text-white" : "text-neutral-500"}`}>
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-neutral-400 leading-tight font-sans">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* WhatsApp Family Emergency Dispatch Banner */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <button
                          onClick={() => setShowWhatsAppModal(true)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-emerald-400/40 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all"
                        >
                          <MessageSquare className="w-4 h-4 animate-bounce" />
                          <span>🚨 Dispatch Location to Family on WhatsApp</span>
                        </button>
                      </div>

                      {/* Siren and Call Keys */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                          onClick={() => {
                            const newMute = !isSirenMutedState;
                            setSirenMute(newMute);
                            setIsSirenMutedState(newMute);
                          }}
                          className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border cursor-pointer ${
                            isSirenMutedState 
                              ? "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10" 
                              : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                          }`}
                        >
                          {isSirenMutedState ? "🔇 Siren Off" : "🔊 Siren On"}
                        </button>
                        
                        <a href="tel:+919876543210" className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md text-center flex items-center justify-center">
                          Call Rescue
                        </a>
                        
                        <button 
                          onClick={() => {
                            if (user.id === "GUEST") {
                              setShowRegPromptModal(true);
                            } else {
                              setSosActive(false);
                              setSosPlan(null);
                              stopEmergencySiren();
                            }
                          }}
                          className="py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-white/5 text-white text-xs font-bold rounded-xl text-center cursor-pointer"
                        >
                          Cancel SOS
                        </button>
                      </div>
                    </div>

                    {/* Cryptographic Ledger Proof Card */}
                    {blockchainData && (
                      <div className="glass-panel rounded-2xl p-5 shadow-md border border-neutral-100 space-y-3 bg-[#0A0B10] text-[#E0E2E7]">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Stellar Decentralized Verification</span>
                          </div>
                          <span className="text-[8px] font-mono text-gray-500">Block #{blockchainData.blockNumber}</span>
                        </div>

                        {/* 4-Step Blockchain Visual Confirmation Timeline */}
                        <div className="grid grid-cols-4 gap-1.5 py-1">
                          {[
                            { step: 1, label: "Hash Created", active: sosPhase >= 1, sub: blockchainData.hash.slice(0, 8) },
                            { step: 2, label: "Record Stored", active: sosPhase >= 4, sub: `Blk #${blockchainData.blockNumber}` },
                            { step: 3, label: "Hospital Ack", active: sosPhase >= 6, sub: "Capacity Locked" },
                            { step: 4, label: "Verified", active: sosPhase >= 7, sub: "100% Immutable" },
                          ].map((bStep) => (
                            <div 
                              key={bStep.step}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center space-y-0.5 font-mono text-[8px] transition-all ${
                                bStep.active
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                  : "bg-white/5 border-white/5 text-neutral-500"
                              }`}
                            >
                              <span className="font-bold">{bStep.active ? "✓" : bStep.step}</span>
                              <span className="font-bold text-[9px] truncate w-full">{bStep.label}</span>
                              <span className="text-[7px] text-neutral-400 font-normal truncate w-full">{bStep.sub}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2 text-[9px] font-mono pt-1">
                          <div>
                            <span className="text-gray-500 block">Emergency Hash (SHA-256):</span>
                            <span className="text-neutral-200 break-all bg-white/5 p-1 rounded block mt-0.5 select-all">{blockchainData.hash}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-500 block">Transaction ID:</span>
                              <span className="text-neutral-200 truncate block mt-0.5 select-all bg-white/5 p-1 rounded">{blockchainData.txId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Merkle Root:</span>
                              <span className="text-neutral-200 truncate block mt-0.5 select-all bg-white/5 p-1 rounded">{blockchainData.merkleRoot}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[8px] text-gray-500 pt-1">
                            <span>Proof sealed: {blockchainData.timestamp}</span>
                            <span className="text-emerald-500 font-extrabold uppercase">Validator: Approved</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="protect-ready-card glass-panel rounded-2xl p-5 shadow-md border border-neutral-100 text-center py-8 space-y-2">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-neutral-500">Precise Tracking Beacon is primed.</p>
                    <p className="text-[10px] text-neutral-400 font-semibold px-4 leading-relaxed">
                      Hold or press the SOS button on the home dashboard to initialize emergency dispatches and track responder arrivals live.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* TAB D: REWARDS & SYSTEM READY INDEX */}
            {activeTab === "history" && (
              <VillageCredits />
            )}

            {/* TAB E: PROFILE & DIGITAL HEALTH ID */}
            {activeTab === "profile" && (
              <HealthIdScreen 
                user={user} 
                onUpdateUser={(updatedUser) => setUser(updatedUser)} 
                onLogout={() => {
                  localStorage.removeItem("sahara_current_user");
                  setUser(GUEST_PROFILE);
                  setScreen("landing");
                  setActiveTab("home");
                }}
              />
            )}

          </main>

          {/* GLOBAL BOTTOM NAVIGATION PANEL */}
          <nav className="dashboard-site-nav fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-8 pt-4 border-t border-white/10 bg-[#0F111A]/95 backdrop-blur-xl">
            {/* Ambient High-Tech Status Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-orange-500/30 via-green-400/30 to-blue-500/30" />

            <button 
              onClick={() => { setActiveTab("home"); setActiveOverlay(null); }}
              className={`flex flex-col items-center gap-1 group transition-all cursor-pointer ${activeTab === "home" ? "scale-105 text-orange-500" : "text-[#9CA3AF] hover:text-white"}`}
            >
              <div className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-md ${activeTab === "home" ? "bg-orange-600 text-white shadow-orange-950/40" : "bg-white/5 border border-white/5"}`}>
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase">{t("Home")}</span>
            </button>

            <button 
              onClick={() => { setActiveTab("explore"); setActiveOverlay(null); }}
              className={`flex flex-col items-center gap-1 group transition-all cursor-pointer ${activeTab === "explore" ? "scale-105 text-orange-500" : "text-[#9CA3AF] hover:text-white"}`}
            >
              <div className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-md ${activeTab === "explore" ? "bg-orange-600 text-white shadow-orange-950/40" : "bg-white/5 border border-white/5"}`}>
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase font-bold">{t("AI Chat")}</span>
            </button>

            <button 
              onClick={() => { setActiveTab("protect"); setActiveOverlay(null); }}
              className={`flex flex-col items-center gap-1 group transition-all cursor-pointer ${activeTab === "protect" ? "scale-105 text-orange-500" : "text-[#9CA3AF] hover:text-white"}`}
            >
              <div className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-md ${activeTab === "protect" ? "bg-orange-600 text-white shadow-orange-950/40" : "bg-white/5 border border-white/5"}`}>
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase">{t("Protect")}</span>
            </button>

            <button 
              onClick={() => {
                if (!checkGuestRestriction("Save Emergency History")) {
                  setActiveTab("history");
                  setActiveOverlay(null);
                }
              }}
              className={`flex flex-col items-center gap-1 group transition-all cursor-pointer ${activeTab === "history" ? "scale-105 text-orange-500" : "text-[#9CA3AF] hover:text-white"}`}
            >
              <div className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-md ${activeTab === "history" ? "bg-orange-600 text-white shadow-orange-950/40" : "bg-white/5 border border-white/5"}`}>
                <Award className="w-4 h-4" />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase font-bold">{t("Impact")}</span>
            </button>

            <button 
              onClick={() => {
                if (!checkGuestRestriction("Save Health ID")) {
                  setActiveTab("profile");
                  setActiveOverlay(null);
                }
              }}
              className={`flex flex-col items-center gap-1 group transition-all cursor-pointer ${activeTab === "profile" ? "scale-105 text-orange-500" : "text-[#9CA3AF] hover:text-white"}`}
            >
              <div className={`flex items-center justify-center rounded-xl w-10 h-10 shadow-md ${activeTab === "profile" ? "bg-orange-600 text-white shadow-orange-950/40" : "bg-white/5 border border-white/5"}`}>
                <User className="w-4 h-4" />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider uppercase font-bold">{t("Health ID")}</span>
            </button>
          </nav>

          {/* ACTIVE CAPABILITIES SLIDEOUT OVERLAY CARDS */}
          {activeOverlay === "family" && (
            <div className={`fixed inset-0 pt-16 z-40 overflow-y-auto ${user.theme === "dark" ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-800"}`}>
              <div className="p-4 flex items-center justify-between border-b border-neutral-200/50 max-w-[600px] mx-auto w-full">
                <h3 className="font-sans text-base font-black">Family Circle Locks</h3>
                <button 
                  onClick={() => setActiveOverlay(null)}
                  className="px-4 py-2 bg-neutral-200/50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
              <FamilyCircle />
            </div>
          )}

          {activeOverlay === "disaster" && (
            <div className={`fixed inset-0 pt-16 z-40 overflow-y-auto ${user.theme === "dark" ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-800"}`}>
              <div className="p-4 flex items-center justify-between border-b border-neutral-200/50 max-w-[600px] mx-auto w-full">
                <h3 className="font-sans text-base font-black">Disaster Predictive Analytics</h3>
                <button 
                  onClick={() => setActiveOverlay(null)}
                  className="px-4 py-2 bg-neutral-200/50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
              <DisasterAnalytics />
            </div>
          )}

          {activeOverlay === "volunteer" && (
            <div className={`fixed inset-0 pt-16 z-40 overflow-y-auto ${user.theme === "dark" ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-800"}`}>
              <div className="p-4 flex items-center justify-between border-b border-neutral-200/50 max-w-[600px] mx-auto w-full">
                <h3 className="font-sans text-base font-black">Volunteer & Blood donor network</h3>
                <button 
                  onClick={() => setActiveOverlay(null)}
                  className="px-4 py-2 bg-neutral-200/50 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
              <VolunteerBloodScreen />
            </div>
          )}

          {activeOverlay === "admin" && (
            <div className={`fixed inset-0 pt-16 z-40 overflow-y-auto bg-neutral-950 text-neutral-100`}>
              <div className="p-4 flex items-center justify-between border-b border-neutral-800 max-w-[1200px] mx-auto w-full">
                <h3 className="font-sans text-base font-black text-red-500">Dispatch Coordinator Dashboard</h3>
                <button 
                  onClick={() => setActiveOverlay(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
              <ResponderDashboard />
            </div>
          )}
          {showRegPromptModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-6">
              <div className="bg-[#121424] border border-white/10 rounded-3xl p-6 max-w-[400px] w-full text-center space-y-6 shadow-2xl animate-fade-in text-white">
                <div className="w-16 h-16 bg-orange-600/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight leading-tight">Secure Your Safety Record</h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Would you like to register a Sahara account? This secures your emergency history, medical parameters, and family contacts onto our secure public ledger.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setShowRegPromptModal(false);
                      setSosActive(false);
                      setSosPlan(null);
                      stopEmergencySiren();
                      setScreen("auth");
                    }}
                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Create Secure Account Now
                  </button>
                  <button
                    onClick={() => {
                      setShowRegPromptModal(false);
                      setSosActive(false);
                      setSosPlan(null);
                      stopEmergencySiren();
                      setScreen("landing");
                    }}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          )}

          {guestRestrictedFeature && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
              <div className="bg-[#121424] border border-white/10 rounded-3xl p-6 max-w-[400px] w-full text-center space-y-6 shadow-2xl animate-fade-in text-white">
                <div className="w-16 h-16 bg-orange-600/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                  <User className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight leading-tight">Login Required</h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Please log in to use the <strong>{guestRestrictedFeature}</strong> feature. Standard Sahara profiles are encrypted and persisted on our decentralized public safety nodes.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setGuestRestrictedFeature(null);
                      setAuthInitialMode("login");
                      setAuthCancelRedirect("dashboard");
                      setScreen("auth");
                    }}
                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setGuestRestrictedFeature(null);
                      setAuthInitialMode("register");
                      setAuthCancelRedirect("dashboard");
                      setScreen("auth");
                    }}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider border border-white/10"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => {
                      setGuestRestrictedFeature(null);
                    }}
                    className="w-full h-11 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD LEVEL ELDERLY CONFIRM MODAL */}
          {showVoiceSystem && (
            <VoiceEmergencySystem
              userLanguage={user.language as "en" | "hi"}
              onConfirm={(confirmedText) => {
                setShowVoiceSystem(false);
                triggerSOS("medical", confirmedText);
              }}
              onCancel={() => {
                setShowVoiceSystem(false);
              }}
            />
          )}

          {showElderlyConfirm && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
              <div className="bg-[#121424] border border-white/10 rounded-3xl p-6 max-w-[400px] w-full text-center space-y-6 shadow-2xl animate-fade-in text-white">
                <div className="w-16 h-16 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight leading-tight">Confirm Emergency SOS?</h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Elderly tap trigger initiated. Are you sure you want to dispatch emergency units to your coordinates immediately?
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setShowElderlyConfirm(false);
                      setShowVoiceSystem(true);
                    }}
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Yes, Start Voice Lifeline
                  </button>
                  <button
                    onClick={() => {
                      setShowElderlyConfirm(false);
                      try {
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(new SpeechSynthesisUtterance("SOS request cancelled."));
                        }
                      } catch (e) {}
                    }}
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD LOADING OVERLAY */}
          {showDashboardLoading && (
            <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-20 h-20 bg-red-600/15 border border-red-500/30 rounded-full flex items-center justify-center relative">
                <span className="absolute inset-0 bg-red-600/20 rounded-full animate-ping" />
                <Activity className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black tracking-widest text-red-500 uppercase">{dashboardLoadingText}</h3>
                <p className="text-[10px] text-neutral-400 font-mono">Verifying system heartbeat & local relays...</p>
              </div>
            </div>
          )}

          {/* INTERACTIVE SMARTWATCH COMPANION SIMULATOR PANE */}
          {showWatchSimulator && (
            <div className="fixed bottom-24 right-6 md:right-12 z-[90] max-w-[340px] w-full bg-[#080912] border border-white/10 rounded-[40px] p-5 shadow-2xl animate-fade-in text-white font-sans">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⌚</span>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white leading-none">Sahara WatchOS</h4>
                    <span className="text-[8px] text-emerald-400 font-mono font-bold">Bluetooth Companion Connected</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWatchSimulator(false)}
                  className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 text-xs cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Watch Outer Chassis Grid */}
              <div className="flex flex-col items-center justify-center space-y-4">
                
                {/* Watch circular display window */}
                <div className="relative w-40 h-40 rounded-full border-[10px] border-[#1C1D2A] bg-black shadow-inner flex flex-col items-center justify-center overflow-hidden">
                  
                  {/* Neon display highlights */}
                  <div className="absolute top-3 text-[8px] font-mono font-extrabold text-[#38BDF8] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span>LTE SECURED</span>
                  </div>

                  {/* Active telemetry readings */}
                  <div className="text-center space-y-1 z-10">
                    {watchStatusText ? (
                      <div className="px-2 animate-pulse text-center">
                        <span className="text-[8px] font-mono text-red-500 font-black block uppercase tracking-widest">ALERT</span>
                        <p className="text-[10px] font-black text-white leading-tight mt-0.5">{watchStatusText}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1 text-red-500 text-xs font-black">
                          <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                          <span>{watchBpm} BPM</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-white leading-none">{watchTime}</div>
                        <div className="text-[8px] font-mono text-neutral-400">92% Battery [Sim]</div>
                      </>
                    )}
                  </div>

                  {/* Interactive hold progress overlay inside watch */}
                  {watchSosProgress > 0 && (
                    <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-black text-red-500 font-mono">{Math.max(1, Math.ceil(5 - (watchSosProgress / 100) * 5))}s</span>
                        <span className="text-[7px] font-mono text-neutral-400 block uppercase font-bold tracking-widest">HOLD CROWN</span>
                      </div>
                    </div>
                  )}

                  {/* Ripple effects */}
                  {watchPulseActive && (
                    <div className="absolute inset-0 bg-red-600/20 animate-ping rounded-full" />
                  )}
                </div>

                {/* IoT Watch Action Controls */}
                <div className="w-full space-y-1.5">
                  <span className="text-[8px] font-mono text-neutral-500 block uppercase font-black text-center">Simulate Wearable Sensors</span>
                  
                  {/* Smart Watch Long-Press button simulation */}
                  <button
                    onMouseDown={() => {
                      setWatchSosProgress(1);
                      setWatchStatusText("HOLDING CROWN...");
                      try {
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(new SpeechSynthesisUtterance("Keep pressing smartwatch crown to trigger rescue."));
                        }
                      } catch (e) {}
                      let interval = setInterval(() => {
                        setWatchSosProgress(prev => {
                          if (prev >= 100) {
                            clearInterval(interval);
                            setWatchSosProgress(0);
                            setWatchStatusText("CROWN SUCCESS!");
                            try {
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Smartwatch triggered. Dispatched emergency units."));
                              }
                            } catch (e) {}
                            triggerSOS("medical");
                            setTimeout(() => setWatchStatusText(""), 2000);
                            return 0;
                          }
                          return prev + 2; // 50 steps of 100ms = 5000ms = 5s
                        });
                      }, 100);
                      (window as any)._watchInterval = interval;
                    }}
                    onMouseUp={() => {
                      clearInterval((window as any)._watchInterval);
                      setWatchSosProgress(0);
                      setWatchStatusText("RELEASED");
                      setTimeout(() => setWatchStatusText(""), 1500);
                    }}
                    onMouseLeave={() => {
                      clearInterval((window as any)._watchInterval);
                      setWatchSosProgress(0);
                      setWatchStatusText("");
                    }}
                    className="w-full h-8 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center"
                  >
                    Press & Hold Crown (5s)
                  </button>

                  <div className="grid grid-cols-3 gap-1">
                    {/* Fall detection */}
                    <button
                      onClick={() => {
                        setWatchPulseActive(true);
                        setWatchStatusText("FALL DETECTED!");
                        try {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Smartwatch alert. Fall impact detected. Dispatching help in five seconds."));
                          }
                        } catch (e) {}
                        
                        let countdown = 5;
                        let interval = setInterval(() => {
                          countdown--;
                          if (countdown <= 0) {
                            clearInterval(interval);
                            setWatchPulseActive(false);
                            setWatchStatusText("FALL DISPATCHED!");
                            triggerSOS("medical");
                            setTimeout(() => setWatchStatusText(""), 2000);
                          } else {
                            setWatchStatusText(`FALL - ${countdown}s`);
                          }
                        }, 1000);
                      }}
                      className="h-9 bg-white/5 hover:bg-white/10 text-orange-400 text-[8px] font-bold rounded-lg flex flex-col items-center justify-center cursor-pointer border border-white/5 transition-all text-center"
                    >
                      <span>🚶‍♂️💨</span>
                      <span>Fall Event</span>
                    </button>

                    {/* Crash detection */}
                    <button
                      onClick={() => {
                        setWatchPulseActive(true);
                        setWatchStatusText("CRASH IMPACT!");
                        try {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Smartwatch alert. High speed impact crash detected. Dispatching help."));
                          }
                        } catch (e) {}
                        
                        let countdown = 5;
                        let interval = setInterval(() => {
                          countdown--;
                          if (countdown <= 0) {
                            clearInterval(interval);
                            setWatchPulseActive(false);
                            setWatchStatusText("CRASH SENT!");
                            triggerSOS("fire");
                            setTimeout(() => setWatchStatusText(""), 2000);
                          } else {
                            setWatchStatusText(`CRASH - ${countdown}s`);
                          }
                        }, 1000);
                      }}
                      className="h-9 bg-white/5 hover:bg-white/10 text-red-400 text-[8px] font-bold rounded-lg flex flex-col items-center justify-center cursor-pointer border border-white/5 transition-all text-center"
                    >
                      <span>🚗💥</span>
                      <span>Car Crash</span>
                    </button>

                    {/* Heart Abnormality */}
                    <button
                      onClick={() => {
                        setWatchPulseActive(true);
                        setWatchStatusText("HR SPIKE (188)!");
                        try {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Smartwatch alert. Abnormal heart rate spike detected. Sending ambulance."));
                          }
                        } catch (e) {}
                        
                        let countdown = 5;
                        let interval = setInterval(() => {
                          countdown--;
                          if (countdown <= 0) {
                            clearInterval(interval);
                            setWatchPulseActive(false);
                            setWatchStatusText("HR ALERT SENT!");
                            triggerSOS("medical");
                            setTimeout(() => setWatchStatusText(""), 2000);
                          } else {
                            setWatchStatusText(`HR SPIKE - ${countdown}s`);
                          }
                        }, 1000);
                      }}
                      className="h-9 bg-white/5 hover:bg-white/10 text-pink-400 text-[8px] font-bold rounded-lg flex flex-col items-center justify-center cursor-pointer border border-white/5 transition-all text-center"
                    >
                      <span>💓📈</span>
                      <span>HR Spike</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {showWeatherDashboard && (
        <WeatherForecastSystem 
          onClose={() => setShowWeatherDashboard(false)} 
          initialCoords={weatherCoords}
        />
      )}

      {/* WhatsApp Emergency Modal Component */}
      <WhatsAppEmergencyModal 
        isOpen={showWhatsAppModal} 
        onClose={() => setShowWhatsAppModal(false)} 
        userName={user.name || "Emergency User"} 
        locationAddress={user.address || (homeWeatherData?.location ? `${homeWeatherData.location.village || homeWeatherData.location.city}, IN` : "Current GPS Coordinates Pinned")} 
        lat={weatherCoords?.lat || 19.07604} 
        lng={weatherCoords?.lon || 72.87772} 
        emergencyType="Emergency SOS Alert"
      />

    </div>
  );
}
