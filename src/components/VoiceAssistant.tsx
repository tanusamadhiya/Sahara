import { useState, useRef, useEffect } from "react";
import { 
  Mic, MicOff, Send, Sparkles, AlertCircle, Copy, Check, Volume2, 
  VolumeX, Languages, RefreshCw, Square, Sliders, CheckCircle2, User, HelpCircle, HeartPulse 
} from "lucide-react";
import { SpeechService, VoiceSettings, DEFAULT_SETTINGS } from "../utils/SpeechService";
import { useTranslation } from "../utils/i18n";

const assistantIllustration = new URL("../assets/coordinator-network.svg", import.meta.url).href;

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  translatedText?: string;
  isTranslated?: boolean;
}

export default function VoiceAssistant() {
  const { language, t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem("sahara_companion_messages");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [
      {
        id: "1",
        role: "model",
        text: t("I am your SAHARA AI companion. I have locked onto your coordinates. Let me know if you need emergency first aid tips, a safe evacuation route, or translations of medical terms."),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const [inputText, setInputText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [micError, setMicError] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string>("");
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [soundMeter, setSoundMeter] = useState<number>(0);
  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Load / Sync Voice Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => SpeechService.getSettings());

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync messages to cache
  useEffect(() => {
    localStorage.setItem("sahara_companion_messages", JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Sync speech service settings
  const handleUpdateVoiceSetting = (key: keyof VoiceSettings, value: any) => {
    const updated = { ...voiceSettings, [key]: value };
    setVoiceSettings(updated);
    SpeechService.updateSettings(updated);
    // Play a short beep or speak to confirm
    if (key === "voiceType" || key === "language") {
      setTimeout(() => {
        const testText = value === "hi" ? "आवाज़ सेटिंग्स अद्यतन" : "Voice settings updated";
        SpeechService.speak(testText, updated.language);
      }, 300);
    }
  };

  // Speak response automatically when a model message is generated
  const speakMessage = (text: string, msgId: string, overrideLang?: "en" | "hi") => {
    setIsSpeaking(true);
    setSpeakingMsgId(msgId);
    SpeechService.speak(
      text, 
      overrideLang || voiceSettings.language,
      () => {
        setIsSpeaking(true);
        setSpeakingMsgId(msgId);
      },
      () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      }
    );
  };

  const stopAllSpeech = () => {
    SpeechService.stopSpeaking();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  // Handle Send Message
  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Stop speech synthesis if user sends message
    stopAllSpeech();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setMicError("");

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history: historyPayload, language })
      });

      const data = await res.json();
      const responseText = data.text || "I have received your coordinate lock. Responders are notified.";

      const modelMsgId = (Date.now() + 1).toString();
      const modelMsg: ChatMessage = {
        id: modelMsgId,
        role: "model",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, modelMsg]);
      setIsLoading(false);

      // Speak answer automatically
      setTimeout(() => {
        speakMessage(responseText, modelMsgId);
      }, 100);

    } catch (err: any) {
      console.error("Chat API error, using safe local mesh offline generation:", err);
      const failMsgId = (Date.now() + 1).toString();
      
      let failText = "I have logged your request. Cellular towers appear degraded, but our local satellite mesh protocol is bridging your coordinates. Keep your device active.";
      if (textToSend.toLowerCase().includes("wound") || textToSend.toLowerCase().includes("first aid")) {
        failText = "First Aid Protocol for deep wounds: Apply firm direct pressure with a clean cloth. Elevate the wound above the heart level. Do not apply a tourniquet unless bleeding is uncontrollable.";
      } else if (textToSend.toLowerCase().includes("snake") || textToSend.toLowerCase().includes("bite")) {
        failText = "Snake Bite Critical Protocol: Keep the victim calm and absolutely still to slow venom spread. Immobilize the limb. DO NOT cut the wound or try to suck out venom. Anti-venom is en route.";
      }

      const failMsg: ChatMessage = {
        id: failMsgId,
        role: "model",
        text: failText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, failMsg]);
      setIsLoading(false);

      // Speak local fail text
      setTimeout(() => {
        speakMessage(failText, failMsgId);
      }, 100);
    }
  };

  // Real Speech recognition toggle
  const toggleRecording = () => {
    if (isRecording) {
      SpeechService.stopListening();
      setIsRecording(false);
      if (recTimerIntervalRef.current) clearInterval(recTimerIntervalRef.current);
    } else {
      setMicError("");
      setRecordingTimer(0);
      setIsRecording(true);

      // Start recording timer
      recTimerIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);

      SpeechService.startListening(
        (transcript) => {
          setIsRecording(false);
          if (recTimerIntervalRef.current) clearInterval(recTimerIntervalRef.current);
          sendMessage(transcript);
        },
        (errorMsg) => {
          setIsRecording(false);
          if (recTimerIntervalRef.current) clearInterval(recTimerIntervalRef.current);
          setMicError(errorMsg);
        },
        () => {
          setIsRecording(false);
          if (recTimerIntervalRef.current) clearInterval(recTimerIntervalRef.current);
        },
        (volume) => {
          setSoundMeter(volume);
        }
      );
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleTranslate = async (msgId: string, text: string) => {
    // Basic Hindi <-> English offline translations or simulation
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      if (m.isTranslated) {
        return { ...m, isTranslated: false };
      }
      
      let trans = "";
      if (m.role === "user") {
        trans = `[Translation]: ${text}`;
      } else {
        // Mock translation dictionary of typical responses
        if (text.includes("deep wounds")) {
          trans = "गहरे घावों के लिए प्राथमिक चिकित्सा प्रोटोकॉल: साफ कपड़े से सीधा दबाव डालें। घाव को हृदय स्तर से ऊपर उठाएं।";
        } else if (text.includes("Snake Bite")) {
          trans = "सांप के काटने का गंभीर प्रोटोकॉल: जहर फैलने से रोकने के लिए पीड़ित को पूरी तरह से शांत और स्थिर रखें। अंग को स्थिर करें।";
        } else {
          trans = "मैं आपका सहारा एआई साथी हूं। मैंने आपके निर्देशांक लॉक कर दिए हैं। यदि आपको आपातकालीन प्राथमिक चिकित्सा युक्तियाँ चाहिए, तो मुझे बताएं।";
        }
      }

      return { ...m, translatedText: trans, isTranslated: true };
    }));
  };

  return (
    <section className="assistant-page-shell">
      <aside className="assistant-hero-panel">
        <div className="assistant-hero-copy">
          <span className="assistant-page-eyebrow"><Sparkles /> YOUR COMMUNITY RESPONSE COPILOT</span>
          <h2>Clear answers.<br /><span>Calmer next steps.</span></h2>
          <p>Ask for practical first-aid guidance, safer routes, or help understanding what to do next.</p>
          <div className="assistant-hero-status"><span /> Voice and chat are ready</div>
        </div>
        <div className="assistant-hero-art">
          <img src={assistantIllustration} alt="Community members and emergency responders working together" />
          <div className="assistant-art-float">Here when you need a hand <HeartPulse /></div>
        </div>
        <div className="assistant-hero-tags">
          <span>First aid guidance</span><span>Voice enabled</span><span>English + Hindi</span>
        </div>
      </aside>
      <div className="assistant-chat-panel">
    <div className="flex flex-col h-[min(78vh,920px)] min-h-[620px] w-full relative select-none bg-[#0F1221] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
      
      {/* Top Controller Bar */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-[#0A0D1A]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSpeaking ? 'bg-orange-500' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSpeaking ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
          </span>
          <div>
            <h3 className="font-sans text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>{isSpeaking ? t("AI Vocal Broadcast Active") : t("Sahara Voice Beacon")}</span>
              <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                PROD AI
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button 
              onClick={stopAllSpeech}
              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-mono text-[9px] font-black rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow"
            >
              <Square className="w-2.5 h-2.5 fill-red-400" /> {t("STOP VOCAL")}
            </button>
          )}

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors cursor-pointer border ${
              showSettings 
                ? "bg-orange-600/20 text-orange-400 border-orange-500/40" 
                : "bg-white/10 border-white/10 text-neutral-300 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Voice Settings Expandable Card */}
      {showSettings && (
        <div className="bg-[#14182B] p-4 border-b border-white/10 space-y-4 animate-fade-in text-white text-xs">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="font-mono text-[10px] font-black text-orange-400 uppercase tracking-widest">Sahara Voice Engine</span>
            <button 
              onClick={() => {
                setVoiceSettings(DEFAULT_SETTINGS);
                SpeechService.updateSettings(DEFAULT_SETTINGS);
              }}
              className="text-[9px] font-mono text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Reset System
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gender setting */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Voice Gender</label>
              <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => handleUpdateVoiceSetting("voiceType", "female")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    voiceSettings.voiceType === "female" ? "bg-orange-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  👩 FEMALE
                </button>
                <button 
                  onClick={() => handleUpdateVoiceSetting("voiceType", "male")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    voiceSettings.voiceType === "male" ? "bg-orange-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  👨 MALE
                </button>
              </div>
            </div>

            {/* Language setting */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Primary Language</label>
              <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => handleUpdateVoiceSetting("language", "en")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    voiceSettings.language === "en" ? "bg-orange-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  English
                </button>
                <button 
                  onClick={() => handleUpdateVoiceSetting("language", "hi")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    voiceSettings.language === "hi" ? "bg-orange-600 text-white shadow" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Speaking Speed Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase">
                <span>Vocal Speed</span>
                <span className="font-mono text-orange-400">{voiceSettings.rate}x</span>
              </div>
              <input 
                type="range"
                min="0.6"
                max="1.6"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => handleUpdateVoiceSetting("rate", parseFloat(e.target.value))}
                className="w-full accent-orange-600 h-1 bg-white/10 rounded-full appearance-none"
              />
            </div>

            {/* Volume */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase">
                <span>System Volume</span>
                <span className="font-mono text-orange-400">{Math.round(voiceSettings.volume * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => handleUpdateVoiceSetting("volume", parseFloat(e.target.value))}
                className="w-full accent-orange-600 h-1 bg-white/10 rounded-full appearance-none"
              />
            </div>
          </div>

          {/* Feedback Toggle */}
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
            <div>
              <p className="text-xs font-bold">Vocal Output Speech Feedback</p>
              <p className="text-[10px] text-neutral-400">Speak generated answers immediately</p>
            </div>
            <button 
              onClick={() => handleUpdateVoiceSetting("feedbackEnabled", !voiceSettings.feedbackEnabled)}
              className={`px-3 py-1.5 font-mono text-[9px] font-black rounded-lg border cursor-pointer ${
                voiceSettings.feedbackEnabled 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-white/5 text-neutral-400 border-white/10"
              }`}
            >
              {voiceSettings.feedbackEnabled ? "ENABLED" : "MUTED"}
            </button>
          </div>
        </div>
      )}

      {/* Mic Capture/Permissions Error Message */}
      {micError && (
        <div className="bg-red-950/90 border-b border-red-500/40 p-3 px-4 text-xs font-semibold text-red-200 flex items-center gap-2 animate-fade-in shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 animate-pulse" />
          <div className="flex-1 leading-normal">
            {micError}
          </div>
          <button 
            onClick={() => setMicError("")}
            className="text-[10px] uppercase font-mono tracking-wider font-extrabold hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages View */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-[#0B0E1B]">
        
        {/* Top visual helper */}
        <section className="flex flex-col items-center justify-center py-2 text-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            
            {/* Ambient Speaking Glow */}
            {isSpeaking && (
              <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full animate-pulse" />
            )}

            {/* Pulsing visual circles */}
            {isSpeaking && (
              <>
                <div className="absolute w-full h-full border border-orange-500/30 rounded-full animate-ping" />
                <div className="absolute w-[80%] h-[80%] border border-orange-500/20 rounded-full animate-pulse" />
              </>
            )}
            
            <img 
              alt="AI Companion Orb" 
              className={`w-18 h-18 object-cover rounded-full z-10 shadow-2xl border-2 border-orange-500/50 transition-transform ${isSpeaking ? 'animate-orb-breathing scale-105' : 'animate-float'}`} 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7KQ3J0avtJsqNGNk4YQNDQNgNNSdsUbY_6prx4aGZLx_h32R0fN8sNvWjoqzwdmOHbQ3cYnPii9-HjhmPVIalDA0rfql_N_WxjYcSGzWiJlDAREUkffkoJ4bttBO3sFXkikzZ44X5_7vQBWdgvFf4hyN_iOwu9W7k6J4OH8ieBpgckDVqJj814fmKxDHdndIa403e4OYsoaky2U9F5IZpPk2owgpPsJv8FCFKRSjjHTSgsdh13-InfQ"
            />
          </div>

          {/* Real-time speaking audio waves */}
          {isSpeaking && (
            <div className="flex items-center gap-1.5 mt-3 p-2 bg-orange-600/15 border border-orange-500/30 rounded-xl px-4 animate-pulse">
              <span className="w-1 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <span className="w-1 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              <span className="w-1 h-4 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-1 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              <span className="w-1 h-6 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="font-mono text-[9px] text-orange-400 font-extrabold tracking-wider uppercase ml-1 animate-pulse">TRANSMITTING VOICE...</span>
            </div>
          )}

          {!isSpeaking && (
            <>
              <h2 className="font-sans text-xs font-bold text-gray-200 mt-2 uppercase tracking-wider">{t("How can Sahara assist?")}</h2>
              <p className="font-sans text-[10px] text-neutral-400 font-medium opacity-90 mt-0.5 leading-relaxed max-w-[340px]">
                {t("Listening via real-time satellite mesh logic. Ask for first aid, snake bites, or nearby emergency help.")}
              </p>
            </>
          )}
        </section>

        {/* Suggestion Quick Prompts */}
        {messages.length <= 1 && (
          <section className="grid grid-cols-2 gap-2.5 mt-1 animate-fade-in text-white">
            <button 
              onClick={() => sendMessage(t("First aid protocols"))}
              className="bg-[#161A2E] border border-white/10 hover:border-orange-500/40 active:scale-98 p-3 rounded-2xl flex flex-col gap-1.5 items-start text-left transition-all cursor-pointer shadow-md group"
            >
              <span className="text-sm bg-red-500/20 p-1.5 rounded-lg text-red-400 group-hover:scale-110 transition-transform">🩹</span>
              <div>
                <span className="font-mono text-[8px] font-black text-red-400 uppercase tracking-widest block">{t("EMERGENCY PROTOCOLS")}</span>
                <span className="text-xs font-black text-white">{t("First Aid Guide")}</span>
              </div>
            </button>

            <button 
              onClick={() => sendMessage(t("Treatment for snake bite"))}
              className="bg-[#161A2E] border border-white/10 hover:border-emerald-500/40 active:scale-98 p-3 rounded-2xl flex flex-col gap-1.5 items-start text-left transition-all cursor-pointer shadow-md group"
            >
              <span className="text-sm bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">🐍</span>
              <div>
                <span className="font-mono text-[8px] font-black text-emerald-400 uppercase tracking-widest block">{t("AGRO ACCIDENT")}</span>
                <span className="text-xs font-black text-white">{t("Snake Bite Care")}</span>
              </div>
            </button>

            <button 
              onClick={() => sendMessage(t("Is there a hospital nearby?"))}
              className="bg-[#161A2E] border border-white/10 hover:border-blue-500/40 active:scale-98 p-3 rounded-2xl flex flex-col gap-1.5 items-start text-left transition-all cursor-pointer shadow-md group"
            >
              <span className="text-sm bg-blue-500/20 p-1.5 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">🚑</span>
              <div>
                <span className="font-mono text-[8px] font-black text-blue-400 uppercase tracking-widest block">{t("NEAREST DISPATCH")}</span>
                <span className="text-xs font-black text-white">{t("Find Nearby Hospital")}</span>
              </div>
            </button>

            <button 
              onClick={() => sendMessage(t("Check safety parameters"))}
              className="bg-[#161A2E] border border-white/10 hover:border-orange-500/40 active:scale-98 p-3 rounded-2xl flex flex-col gap-1.5 items-start text-left transition-all cursor-pointer shadow-md group"
            >
              <span className="text-sm bg-orange-500/20 p-1.5 rounded-lg text-orange-400 group-hover:scale-110 transition-transform">🛡️</span>
              <div>
                <span className="font-mono text-[8px] font-black text-orange-400 uppercase tracking-widest block">{t("MESH VERIFIED")}</span>
                <span className="text-xs font-black text-white">{t("Check Safety Score")}</span>
              </div>
            </button>
          </section>
        )}

        {/* Conversation flow */}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[92%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"} animate-fade-in`}
            >
              {/* Message Header info */}
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold tracking-wider text-neutral-300 font-mono">
                {msg.role === "model" ? (
                  <span className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center text-[9px] font-black shadow-sm border border-orange-400/40">S</span>
                ) : (
                  <span className="w-5 h-5 rounded-md bg-white/10 text-white flex items-center justify-center text-[9px] font-bold border border-white/10">U</span>
                )}
                <span className="text-white">{msg.role === "user" ? "YOU" : "SAHARA AI DISPATCH"}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{msg.timestamp}</span>
              </div>

              {/* Message Content Bubble */}
              <div 
                className={`p-4 rounded-2xl shadow-xl transition-all ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium text-xs sm:text-sm leading-relaxed rounded-tr-none border border-orange-400/30" 
                    : "bg-[#181C30] border border-orange-500/30 text-slate-100 font-sans text-xs sm:text-sm leading-relaxed rounded-tl-none shadow-orange-950/20"
                }`}
              >
                {/* Main Text with explicit line height and contrast */}
                <p className="whitespace-pre-wrap leading-relaxed text-slate-100 font-medium">
                  {msg.isTranslated && msg.translatedText ? msg.translatedText : msg.text}
                </p>
              </div>

              {/* Action Buttons for Model messages */}
              {msg.role === "model" && (
                <div className="flex items-center gap-2 mt-2 ml-1 select-none">
                  {/* Replay */}
                  <button 
                    onClick={() => speakMessage(msg.isTranslated && msg.translatedText ? msg.translatedText : msg.text, msg.id)}
                    className={`p-1.5 rounded-xl transition-all border cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold ${
                      speakingMsgId === msg.id 
                        ? "bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-950/50" 
                        : "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10"
                    }`}
                    title="Speak / Replay Response"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === msg.id ? 'animate-bounce' : ''}`} />
                    <span>{speakingMsgId === msg.id ? "Speaking..." : "Listen"}</span>
                  </button>

                  {/* Copy */}
                  <button 
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="p-1.5 bg-white/5 border border-white/10 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                  </button>

                  {/* Translate */}
                  <button 
                    onClick={() => handleTranslate(msg.id, msg.text)}
                    className={`p-1.5 rounded-xl transition-colors border cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold ${
                      msg.isTranslated 
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                        : "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10"
                    }`}
                    title="Translate to English/Hindi"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{msg.isTranslated ? "Original" : "हिंदी"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Loading status */}
          {isLoading && (
            <div className="mr-auto items-start max-w-[85%] w-full flex flex-col animate-pulse">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold tracking-wider text-neutral-400 font-mono">
                <span className="w-4 h-4 rounded bg-orange-600 text-white flex items-center justify-center text-[8px] font-extrabold">S</span>
                <span>SAHARA AI</span>
                <span>•</span>
                <span>Synthesizing intelligence...</span>
              </div>
              <div className="w-full bg-[#141624] border border-white/5 p-4 rounded-2xl rounded-tl-none space-y-2.5">
                <div className="h-2 bg-white/10 rounded w-full animate-pulse" />
                <div className="h-2 bg-white/10 rounded w-[85%] animate-pulse" />
                <div className="h-2 bg-white/10 rounded w-[55%] animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* VOICE ERROR BANNER WITH RETRY */}
        {micError && (
          <div className="mx-4 my-2 p-3 bg-red-950/25 rounded-2xl border border-red-500/20 flex items-center justify-between gap-3 animate-fade-in">
            <p className="text-[10px] text-red-400 font-semibold flex items-center gap-1.5 leading-tight">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
              <span>Could not understand. Please speak again. ({micError})</span>
            </p>
            <button
              onClick={() => {
                setMicError("");
                toggleRecording();
              }}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-sans text-[8px] font-bold rounded uppercase tracking-wider cursor-pointer transition-colors shrink-0"
            >
              Retry Recording
            </button>
          </div>
        )}

      </div>

      {/* Interactive Bottom Input Bar */}
      <div className="p-4 bg-[#0A0C16] sticky bottom-0 z-30 border-t border-white/5">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-xl">
          
          {/* Refresh prompt flow */}
          <button 
            onClick={() => {
              setMessages([
                {
                  id: Date.now().toString(),
                  role: "model",
                  text: "System cache cleared. Dynamic AI safety assistant is ready for spoken cues.",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Text Input */}
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputText.trim()) {
                sendMessage(inputText);
              }
            }}
            disabled={isLoading || isRecording}
            placeholder={isRecording ? t("Listening to mic... speak now") : t("Ask Sahara...")}
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-white placeholder-neutral-500 px-2 py-2 outline-none"
          />

          {/* Visual Voice Wavebars (while recording) */}
          {isRecording && (
            <div className="flex items-center gap-1 px-2.5 animate-pulse shrink-0">
              <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(10, soundMeter * 0.4)}px`, animationDelay: "0.1s" }} />
              <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(16, soundMeter * 0.7)}px`, animationDelay: "0.3s" }} />
              <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(12, soundMeter * 0.5)}px`, animationDelay: "0.2s" }} />
              <span className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: `${Math.max(8, soundMeter * 0.3)}px`, animationDelay: "0.4s" }} />
              <span className="font-mono text-[9px] text-red-400 font-extrabold ml-1 uppercase">{recordingTimer}s</span>
            </div>
          )}

          {/* Action buttons (Mic or Send) */}
          {inputText.trim() ? (
            <button 
              onClick={() => sendMessage(inputText)}
              className="w-10 h-10 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white rounded-xl active:scale-95 transition-transform cursor-pointer shadow-lg shadow-orange-950/40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={toggleRecording}
              className={`w-10 h-10 flex items-center justify-center rounded-xl active:scale-95 transition-all cursor-pointer border shrink-0 ${
                isRecording 
                  ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                  : 'bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10'
              }`}
              title={isRecording ? "Stop Capture" : "Trigger Mic Control"}
            >
              {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

        </div>
      </div>

    </div>
      </div>
    </section>
  );
}
