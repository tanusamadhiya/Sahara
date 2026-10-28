import { useState, useEffect, useRef } from "react";
import { 
  Mic, Square, Check, Edit3, RefreshCw, AlertTriangle, 
  Keyboard, ShieldAlert, CheckCircle2, Play, ArrowRight 
} from "lucide-react";
import { useTranslation } from "../utils/i18n";

interface VoiceEmergencySystemProps {
  onConfirm: (transcript: string) => void;
  onCancel: () => void;
  userLanguage?: "en" | "hi";
}

type SystemState = "permission-request" | "recording" | "review" | "error" | "fallback";

export default function VoiceEmergencySystem({ onConfirm, onCancel, userLanguage = "en" }: VoiceEmergencySystemProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<SystemState>("permission-request");
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<"hi-IN" | "en-IN" | "en-US">(
    userLanguage === "hi" ? "hi-IN" : "en-IN"
  ); // hi-IN captures mixed Hinglish brilliantly

  // Real Web Audio API reactive waveform state
  const [voiceVolume, setVoiceVolume] = useState<number[]>(new Array(18).fill(4));

  // Refs for asynchronous and cleanup safety
  const stateRef = useRef<SystemState>("permission-request");
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  // Audio analyzer refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync state ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Quick-tap common emergency phrases
  const PRESET_PHRASES = [
    { text: "Mujhe snake bite hua hai", label: "🐍 Snake Bite" },
    { text: "Papa ko chest pain ho raha hai, medical emergency hai", label: "💓 Chest Pain / Attack" },
    { text: "Ghar me aag lag gayi hai", label: "🔥 House Fire" },
    { text: "Mujhe blood loss ho raha hai, accident hua", label: "🚗 Accident / Bleeding" },
    { text: "Police ko call karo, immediate safety risk hai", label: "🚨 Police Help" },
    { text: "Mummy seedhiyon se gir gayi hain, fracture lag raha hai", label: "🤕 Fall Injury" }
  ];

  // Request Microphone Permission
  const requestPermission = async () => {
    try {
      setPermissionDenied(false);
      
      // Stop any active stream first
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      // Check if Web Speech API is available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        changeState("fallback");
      } else {
        changeState("recording");
        startSpeechRecognition(stream);
      }
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setPermissionDenied(true);
      changeState("permission-request");
    }
  };

  const changeState = (newState: SystemState) => {
    stateRef.current = newState;
    setState(newState);
  };

  // Start permissions on mount
  useEffect(() => {
    requestPermission();
    return () => {
      cleanupResources();
    };
  }, []);

  // Cleanup helper
  const cleanupResources = () => {
    // 1. Stop Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // 2. Stop Web Audio Analyzer Loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
        }
      } catch (e) {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;

    // 3. Clear Timeouts & Intervals
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 4. Stop Microphone tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  // Start Real Speech Recognition
  const startSpeechRecognition = (stream: MediaStream) => {
    // Clean up timers and speech references but keep current stream active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    setTranscript("");
    setInterimTranscript("");
    setTimer(0);
    setIsListening(true);
    changeState("recording");

    // Initialize Web Audio API live waveform analyzer
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyserRef.current = analyser;
      audioCtxRef.current = audioContext;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (stateRef.current !== "recording" || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const newVolumes = [];
        for (let i = 0; i < 18; i++) {
          const val = dataArray[i % bufferLength] || 0;
          // Scale to a height of 4px to 54px
          const height = Math.max(4, Math.floor((val / 255) * 50));
          newVolumes.push(height);
        }
        setVoiceVolume(newVolumes);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (e) {
      console.warn("Could not start audio context analyser:", e);
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      changeState("fallback");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      // Start counting up timer
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

      // Handle speech result with robust duplication prevention
      recognition.onresult = (event: any) => {
        let finalConcat = "";
        let interimConcat = "";

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalConcat += result[0].transcript + " ";
          } else {
            interimConcat += result[0].transcript;
          }
        }

        setTranscript(finalConcat.trim());
        setInterimTranscript(interimConcat);

        // Reset silence detection timeout whenever user speaks
        if (finalConcat.trim() || interimConcat.trim()) {
          resetSilenceTimeout();
        }
      };

      // Handle errors
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // If no speech at all is detected, let the silence safety timer handle it
        } else if (event.error === "not-allowed") {
          setPermissionDenied(true);
          changeState("permission-request");
        } else {
          // Process what we have, fallback to error if empty
          stopRecordingAndVerify();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Only trigger auto-transcribe if we are still on the recording screen
        if (stateRef.current === "recording") {
          const finalResult = (transcript + " " + interimTranscript).trim();
          if (finalResult.length > 1) {
            setTranscript(finalResult);
            setManualText(finalResult);
            changeState("review");
          } else {
            changeState("error");
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

      // Initial silence safety timer: if absolutely nothing is said in the first 8 seconds, transition
      silenceTimeoutRef.current = setTimeout(() => {
        stopRecordingAndVerify();
      }, 10000);

    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      changeState("fallback");
    }
  };

  // Silence timer: automatically stops and transcribes if user is silent for 3.5 seconds
  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    silenceTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === "recording") {
        console.log("Silence detected. Auto-processing transcript.");
        stopRecordingAndVerify();
      }
    }, 3500); 
  };

  // Stop recording and transition state
  const stopRecordingAndVerify = () => {
    setIsListening(false);
    
    // Grab transcripts before cleaning up resources
    const finalResult = (transcript + " " + interimTranscript).trim();
    
    cleanupResources();

    if (finalResult.length > 1) {
      setTranscript(finalResult);
      setManualText(finalResult);
      changeState("review");
    } else {
      changeState("error");
    }
  };

  // Restart speech recognition on language switch
  const handleLanguageChange = (lang: "hi-IN" | "en-IN" | "en-US") => {
    setSelectedLanguage(lang);
    if (audioStreamRef.current) {
      startSpeechRecognition(audioStreamRef.current);
    } else {
      requestPermission();
    }
  };

  // Format Timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/98 backdrop-blur-lg z-[150] flex flex-col justify-between p-6 md:p-8 text-white font-sans animate-fade-in select-none">
      
      {/* Top Bar Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-red-500 uppercase">{t("Sahara Secures Voice Rescue")}</span>
        </div>
        <button 
          onClick={() => {
            cleanupResources();
            onCancel();
          }}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-white/5"
        >
          {t("Cancel SOS")}
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full py-8 space-y-8">
        
        {/* STEP 1: Permission request screen / Denied state */}
        {state === "permission-request" && (
          <div className="text-center space-y-6 animate-fade-in w-full max-w-sm">
            <div className="w-20 h-20 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-black tracking-tight leading-snug">Microphone Access Required</h3>
              <p className="text-sm text-neutral-400 leading-relaxed px-4">
                {permissionDenied 
                  ? "Microphone permission is required to activate voice emergency."
                  : "Sahara requires direct access to your microphone to analyze distress voices, categorize emergency severity, and route dispatches instantly."}
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={requestPermission}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase rounded-xl transition-all tracking-wider shadow-lg shadow-red-950/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Retry Permission</span>
              </button>
              <button
                onClick={onCancel}
                className="w-full h-12 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 & 3: Recording screen with active mic */}
        {state === "recording" && (
          <div className="text-center space-y-8 w-full animate-fade-in">
            
            {/* Language Preset Engine Selectors */}
            <div className="flex justify-center items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-2xl max-w-xs mx-auto">
              <button 
                onClick={() => handleLanguageChange("hi-IN")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${selectedLanguage === "hi-IN" ? "bg-red-600 text-white shadow-md shadow-red-950/40" : "text-neutral-400 hover:text-white"}`}
              >
                Hinglish / Hindi
              </button>
              <button 
                onClick={() => handleLanguageChange("en-IN")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${selectedLanguage === "en-IN" ? "bg-red-600 text-white shadow-md shadow-red-950/40" : "text-neutral-400 hover:text-white"}`}
              >
                English (IN)
              </button>
              <button 
                onClick={() => handleLanguageChange("en-US")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${selectedLanguage === "en-US" ? "bg-red-600 text-white shadow-md shadow-red-950/40" : "text-neutral-400 hover:text-white"}`}
              >
                English (US)
              </button>
            </div>

            <div className="relative">
              {/* Glowing and pulsating ring animation */}
              <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl scale-125 animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.5)] relative z-10">
                <Mic className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-widest text-red-500 uppercase flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                🎤 Listening...
              </h3>
              <p className="text-xs text-neutral-400 font-mono font-bold">Please state your emergency clearly in Hindi, Hinglish or English</p>
              <span className="inline-block px-3 py-1 bg-red-950/40 border border-red-500/15 rounded-full text-xs font-bold text-red-400 font-mono">
                {formatTime(timer)}
              </span>
            </div>

            {/* REAL-TIME RESPONSIVE AUDIO WAVEFORM VISUALIZER */}
            <div className="h-20 flex items-center justify-center gap-1 bg-white/5 border border-white/5 rounded-3xl p-5 max-w-sm mx-auto shadow-inner">
              {voiceVolume.map((vol, i) => (
                <span
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full transition-all duration-75"
                  style={{
                    height: `${vol}px`,
                  }}
                />
              ))}
            </div>

            {/* Live interim display so user knows system is actively translating */}
            <div className="bg-[#0C0D15]/80 border border-white/5 p-4.5 rounded-2xl max-w-md mx-auto min-h-[72px] flex items-center justify-center text-center shadow-lg">
              <p className="text-xs font-semibold leading-relaxed text-neutral-300">
                {transcript || interimTranscript 
                  ? <span className="text-neutral-100 font-bold">"{transcript} <span className="text-red-400">{interimTranscript}</span>"</span>
                  : "Speak now. E.g., \"Mujhe snake bite hua hai...\" or \"Ghar me aag lag gayi...\""}
              </p>
            </div>

            <button
              onClick={stopRecordingAndVerify}
              className="px-6 h-12 bg-white text-black hover:bg-neutral-200 text-xs font-extrabold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md"
            >
              <Square className="w-4 h-4 fill-black" />
              Stop & Process
            </button>
          </div>
        )}

        {/* STEP 4: Show transcript review screen */}
        {state === "review" && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider">Voice Emergency Decoded</h3>
            </div>

            {/* Edit mode toggle text area */}
            <div className="bg-[#0c0d15] border border-white/10 rounded-2xl p-5 space-y-3 shadow-inner relative">
              <span className="text-[9px] font-mono font-black text-neutral-500 uppercase block tracking-wider">Detected Transcript</span>
              
              {isEditing ? (
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full h-24 bg-white/5 border border-red-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-sm font-bold text-neutral-100 leading-relaxed select-all">
                  "{transcript}"
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    if (isEditing) {
                      setTranscript(manualText);
                    }
                    setIsEditing(!isEditing);
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? "Save Edit" : "Edit Transcript"}
                </button>
              </div>
            </div>

            {/* Dispatch and Re-record controls */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  const final = isEditing ? manualText : transcript;
                  if (final.trim().length > 0) {
                    onConfirm(final);
                  }
                }}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl transition-all tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                Confirm & Dispatch Rescue
              </button>
              
              <button
                onClick={() => {
                  if (audioStreamRef.current) {
                    startSpeechRecognition(audioStreamRef.current);
                  } else {
                    requestPermission();
                  }
                }}
                className="w-full h-11 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Record Voice Again
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Error screen - Speech not recognized */}
        {state === "error" && (
          <div className="text-center space-y-6 w-full animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black tracking-tight leading-snug">We Couldn't Understand</h3>
              <p className="text-xs text-neutral-400 leading-relaxed px-4">
                We couldn't recognize your voice clear enough. Please speak closer to the microphone, or type your emergency manually to continue without delay.
              </p>
            </div>

            {/* Quick preset selection for instant debugging and ease of use */}
            <div className="space-y-2 w-full max-w-sm mx-auto">
              <span className="text-[8px] font-mono font-black text-neutral-500 uppercase tracking-widest block text-left mb-1.5">Or tap a quick preset phrase</span>
              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {PRESET_PHRASES.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTranscript(p.text);
                      setManualText(p.text);
                      changeState("review");
                    }}
                    className="py-2 px-3 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl text-left text-[10px] font-semibold transition-all cursor-pointer flex justify-between items-center group text-neutral-300 hover:text-white"
                  >
                    <span>{p.text}</span>
                    <span className="text-[8px] font-mono text-neutral-500 group-hover:text-red-400 font-bold shrink-0 ml-2">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  if (audioStreamRef.current) {
                    startSpeechRecognition(audioStreamRef.current);
                  } else {
                    requestPermission();
                  }
                }}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Voice Recording
              </button>

              <button
                onClick={() => {
                  setManualText("");
                  changeState("fallback");
                }}
                className="w-full h-11 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/5"
              >
                <Keyboard className="w-4 h-4" />
                Type Emergency Manually
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Fallback state for unsupported browsers or system errors */}
        {state === "fallback" && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                Keyboard Fallback Mode
              </span>
              <h3 className="text-lg font-black tracking-tight leading-snug">Voice Input Offline</h3>
              <p className="text-xs text-neutral-400 leading-relaxed px-4">
                Speech recognition is unavailable on this device or browser. Please type your emergency description below to launch dispatch.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0c0d15] border border-white/10 rounded-2xl p-4 space-y-3">
                <span className="text-[9px] font-mono font-black text-neutral-500 uppercase block tracking-wider">Describe the emergency</span>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="E.g., Ghar me aag lag gayi hai or Mummy seedhiyon se gir gayi hain..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 font-sans leading-relaxed"
                />
              </div>

              {/* Quick preset selection in fallback */}
              <div className="space-y-2">
                <span className="text-[8px] font-mono font-black text-neutral-500 uppercase tracking-widest block mb-1">Select a Preset for Quick Dispatch</span>
                <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {PRESET_PHRASES.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setManualText(p.text);
                      }}
                      className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left text-[10px] font-semibold transition-all cursor-pointer flex justify-between items-center text-neutral-300 hover:text-white"
                    >
                      <span>{p.text}</span>
                      <span className="text-[8px] font-mono text-neutral-500 font-bold shrink-0 ml-2">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (manualText.trim().length > 0) {
                  onConfirm(manualText);
                }
              }}
              disabled={manualText.trim().length === 0}
              className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-black uppercase rounded-xl transition-all tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              Confirm & Dispatch
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
