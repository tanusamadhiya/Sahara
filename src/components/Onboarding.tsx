import { useState } from "react";
import { ArrowRight, ShieldCheck, Landmark, Satellite, MessageSquare, PhoneCall, WifiOff, MessageCircle, Globe, Shield } from "lucide-react";
import { useTranslation } from "../utils/i18n";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const { t } = useTranslation();

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center relative select-none overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 60%, #120a1e 100%)" }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse"
          style={{ background: "rgba(59,130,246,0.07)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{ background: "rgba(249,115,22,0.06)", animationDelay: "1s" }}
        />
        <div
          className="absolute top-3/4 left-1/3 w-48 h-48 rounded-full blur-3xl animate-pulse"
          style={{ background: "rgba(52,211,153,0.05)", animationDelay: "2s" }}
        />
      </div>

      {/* Top header bar */}
      <header className="absolute top-0 left-0 w-full z-10 flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#ea580c,#dc2626)", boxShadow: "0 0 20px rgba(234,88,12,0.4)" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans text-lg font-black tracking-tight text-white">{t("common.appName")}</span>
        </div>
        {step < 3 && (
          <button
            onClick={onComplete}
            className="font-mono text-xs font-semibold uppercase tracking-widest cursor-pointer border px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(163,163,163,1)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            {t("common.skip")}
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[480px] flex-1 flex flex-col items-center justify-between pt-20 pb-10 px-6 relative z-10">

        {/* STEP 1: AI POWERED HELP */}
        {step === 1 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="text-center space-y-3 mb-8">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold tracking-widest"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}
              >
                <Globe className="w-3 h-3" /> AI-Powered Intelligence
              </span>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight leading-tight text-white">
                {t("onboarding.step1Title")}
              </h2>
              <p className="font-sans text-sm font-medium max-w-[280px] mx-auto leading-relaxed" style={{ color: "#9ca3af" }}>
                {t("onboarding.step1Desc")}
              </p>
            </div>

            {/* Glowing AI Orb Visualizer */}
            <div className="relative w-72 h-72 flex items-center justify-center my-4 animate-float">
              {/* Outer Pulsing Rings */}
              <div
                className="absolute w-full h-full rounded-full animate-sos-pulse"
                style={{ border: "2px solid rgba(59,130,246,0.2)" }}
              />
              <div
                className="absolute w-4/5 h-4/5 rounded-full animate-sos-pulse"
                style={{ border: "1px solid rgba(249,115,22,0.2)", animationDelay: "0.8s" }}
              />
              <div
                className="absolute w-3/5 h-3/5 rounded-full animate-sos-pulse"
                style={{ border: "1px solid rgba(52,211,153,0.1)", animationDelay: "1.6s" }}
              />

              {/* Main Orb */}
              <div
                className="relative w-56 h-56 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  border: "2px solid rgba(59,130,246,0.3)",
                  boxShadow: "0 0 60px rgba(59,130,246,0.25), 0 0 120px rgba(59,130,246,0.1)",
                }}
              >
                <img
                  alt="AI Emergency Intelligence — neural network visualization"
                  className="w-full h-full object-cover animate-orb-breathing"
                  src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=500&h=500&q=85"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=500&h=500&q=85";
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(135deg,rgba(30,58,95,0.4),transparent,rgba(120,53,15,0.2))" }}
                />
              </div>

              {/* Floating status badge */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white px-4 py-2 rounded-full shadow-xl font-mono font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ background: "rgba(37,99,235,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(96,165,250,0.3)", fontSize: "10px" }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                AI Analysis Active
              </div>
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-[320px]">
              <span
                className="flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", color: "#f87171" }}
              >
                🧠 Gemini AI Triage
              </span>
              <span
                className="flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold"
                style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa" }}
              >
                ⚡ Real-time Response
              </span>
              <span
                className="flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold"
                style={{ background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.2)", color: "#34d399" }}
              >
                🗣️ Multilingual Voice
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: COMMUNITY RESPONSE NETWORK */}
        {step === 2 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="text-center space-y-3 mb-8">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold tracking-widest"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}
              >
                <Globe className="w-3 h-3" /> Community Network
              </span>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight leading-tight text-white">
                {t("onboarding.step2Title")}
              </h2>
              <p className="font-sans text-sm font-medium max-w-[320px] mx-auto leading-relaxed" style={{ color: "#9ca3af" }}>
                {t("onboarding.step2Desc")}
              </p>
            </div>

            {/* Response Network 3D Nodes */}
            <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center my-2">
              <div
                className="absolute inset-0 rounded-[32px] -rotate-2"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <div
                className="absolute inset-0 rounded-[32px] rotate-1"
                style={{ background: "rgba(255,255,255,0.07)" }}
              />
              <div
                className="relative w-11/12 h-11/12 rounded-[32px] overflow-hidden flex items-center justify-center z-10 p-1"
                style={{
                  background: "linear-gradient(135deg,#0f1a2e,#1a2f4a)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.15)",
                }}
              >
                <img
                  alt="Emergency Response Network — interconnected emergency nodes across India"
                  className="w-full h-full object-cover rounded-[28px] hover:scale-105 transition-transform duration-500"
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=720&h=720&q=85"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?auto=format&fit=crop&w=720&h=720&q=85";
                  }}
                />
                <div
                  className="absolute inset-0 rounded-[28px] pointer-events-none"
                  style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.15) 0%,transparent 50%,rgba(249,115,22,0.1) 100%)" }}
                />
              </div>

              {/* Status Indicator Chips */}
              <div className="absolute -top-4 -right-1 z-20 flex flex-col gap-2 scale-90">
                <div
                  className="text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-float"
                  style={{
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    animationDelay: "0.3s",
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono uppercase font-bold tracking-wider" style={{ fontSize: "9px" }}>
                    {t("onboarding.verifiedResponse")}
                  </span>
                </div>
                <div
                  className="text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md animate-float"
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    animationDelay: "1.1s",
                  }}
                >
                  <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono uppercase font-bold tracking-wider" style={{ fontSize: "9px" }}>
                    {t("onboarding.nodeCount")}
                  </span>
                </div>
              </div>

              {/* Bottom left chip */}
              <div className="absolute -bottom-3 -left-2 z-20">
                <div
                  className="text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-float"
                  style={{
                    background: "rgba(5,150,105,0.9)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    animationDelay: "0.7s",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  <span className="font-mono uppercase font-bold tracking-wider" style={{ fontSize: "9px" }}>
                    Live Network
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WORKS EVERYWHERE */}
        {step === 3 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="text-center space-y-3 mb-8">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold tracking-widest"
                style={{ background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.2)", color: "#fb923c" }}
              >
                <Satellite className="w-3 h-3" /> Works Everywhere
              </span>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight leading-tight text-white">
                {t("onboarding.step3Title")}
              </h2>
              <p className="font-sans text-sm font-medium max-w-[320px] mx-auto leading-relaxed" style={{ color: "#9ca3af" }}>
                {t("onboarding.step3Desc")}
              </p>
            </div>

            {/* SmartPhone SOS Illustration */}
            <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center my-2">
              {/* Background glow */}
              <div
                className="absolute inset-0 rounded-[32px] blur-2xl"
                style={{ background: "linear-gradient(135deg,rgba(234,88,12,0.12),rgba(220,38,38,0.07),transparent)" }}
              />
              <div
                className="absolute inset-0 rounded-[32px] blur-xl"
                style={{ background: "linear-gradient(225deg,rgba(5,150,105,0.07),transparent)" }}
              />

              <img
                alt="Smartphone displaying SOS emergency alert with satellite and mesh connectivity"
                className="relative z-10 object-contain drop-shadow-2xl"
                style={{ width: "68%", height: "68%" }}
                src="https://images.unsplash.com/photo-1601972599720-36938d4ecd31?auto=format&fit=crop&w=600&h=600&q=85"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&h=600&q=85";
                }}
              />

              {/* Float tokens */}
              <div className="absolute inset-0 pointer-events-none z-20">
                <div
                  className="absolute top-10 right-8 p-2.5 rounded-xl shadow-lg animate-float"
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    animationDelay: "0.2s",
                  }}
                >
                  <WifiOff className="w-4 h-4 text-orange-400" />
                </div>
                <div
                  className="absolute bottom-16 left-6 p-2.5 rounded-xl shadow-lg animate-float"
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    animationDelay: "1.2s",
                  }}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div
                  className="absolute top-20 left-8 p-2.5 rounded-xl shadow-lg animate-float"
                  style={{
                    background: "rgba(234,88,12,0.85)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(251,146,60,0.2)",
                    animationDelay: "0.8s",
                  }}
                >
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
                <div
                  className="absolute bottom-28 right-10 p-2 rounded-xl shadow-lg animate-float"
                  style={{
                    background: "rgba(37,99,235,0.85)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(96,165,250,0.2)",
                    animationDelay: "1.5s",
                  }}
                >
                  <Satellite className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* Capability Badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-[320px]">
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full font-mono uppercase font-bold"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#d1d5db",
                  fontSize: "10px",
                }}
              >
                <Satellite className="w-3 h-3" style={{ color: "#9ca3af" }} /> {t("common.offline")}
              </span>
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full font-mono uppercase font-bold"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#d1d5db",
                  fontSize: "10px",
                }}
              >
                <MessageSquare className="w-3 h-3" style={{ color: "#9ca3af" }} /> SMS
              </span>
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full font-mono uppercase font-bold"
                style={{
                  background: "rgba(5,150,105,0.1)",
                  border: "1px solid rgba(5,150,105,0.2)",
                  color: "#34d399",
                  fontSize: "10px",
                }}
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" /> WhatsApp
              </span>
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full font-mono uppercase font-bold"
                style={{
                  background: "rgba(37,99,235,0.1)",
                  border: "1px solid rgba(37,99,235,0.2)",
                  color: "#60a5fa",
                  fontSize: "10px",
                }}
              >
                <PhoneCall className="w-3 h-3 text-blue-400" /> Voice AI
              </span>
            </div>
          </div>
        )}

        {/* BOTTOM STEP DOTS & CTAs */}
        <div className="w-full space-y-5 flex flex-col items-center mt-6">
          {/* Progress indicators */}
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: step === 1 ? "2rem" : "0.375rem", background: step === 1 ? "#fff" : "rgba(255,255,255,0.2)" }}
            />
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: step === 2 ? "2rem" : "0.375rem", background: step === 2 ? "#fff" : "rgba(255,255,255,0.2)" }}
            />
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: step === 3 ? "2rem" : "0.375rem", background: step === 3 ? "#fff" : "rgba(255,255,255,0.2)" }}
            />
          </div>

          {/* Core Action Button */}
          <button
            onClick={nextStep}
            className="w-full h-14 text-white rounded-2xl font-sans text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            style={{
              background: "linear-gradient(135deg,#ea580c,#dc2626)",
              boxShadow: "0 8px 32px rgba(234,88,12,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(234,88,12,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(234,88,12,0.4)";
            }}
          >
            <span>
              {step === 1 && t("common.next")}
              {step === 2 && t("common.continue")}
              {step === 3 && t("common.getStarted")}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {step < 3 && (
            <p className="font-mono" style={{ fontSize: "10px", color: "#6b7280" }}>
              Step {step} of 3
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
