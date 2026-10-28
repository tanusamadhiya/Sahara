import { useState, useEffect, useRef } from "react";
import { 
  Award, Trophy, Shield, Heart, Clock, Activity, Download, Share2, 
  CheckCircle2, Star, Users, MapPin, Search, ChevronRight, Sparkles, 
  FileText, QrCode, ArrowUpRight, ShieldCheck, HeartPulse, HelpCircle, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const impactIllustration = new URL("../assets/community-impact-art.svg", import.meta.url).href;

// Synthesize a beautiful, clean triumphant major chord using Web Audio API
const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    // Triumphant arpeggio: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      }, index * 100);
    });
  } catch (e) {
    console.warn("AudioContext blocked or failed", e);
  }
};

interface Badge {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  requirement: string;
  earnedDate: string | null; // null if locked
  category: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  score: number;
  livesHelped: number;
  badges: string[];
  hours: number;
  avatar: string;
}

export default function VillageCredits() {
  // Pull current user name if logged in
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("sahara_current_user");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return { name: "Arjun Prasad", village: "Bandra", district: "Mumbai Suburban" };
  });

  // State stats (reputation score, lives helped, responses, donations, hours, rank)
  const [reputationScore, setReputationScore] = useState<number>(780);
  const [livesHelped, setLivesHelped] = useState<number>(14);
  const [emergencyResponses, setEmergencyResponses] = useState<number>(9);
  const [bloodDonations, setBloodDonations] = useState<number>(4);
  const [volunteerHours, setVolunteerHours] = useState<number>(42);
  const [eventsParticipated, setEventsParticipated] = useState<number>(6);
  const [communityRank, setCommunityRank] = useState<string>("#3 in Village");

  // Leaderboard filters: 'village' | 'district' | 'state' | 'national'
  const [leaderboardFilter, setLeaderboardFilter] = useState<"village" | "district" | "state" | "national">("village");
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");

  // Certificates list
  const [certificates, setCertificates] = useState([
    { id: "CERT-SAHARA-001", title: "Verified Blood Donor", badge: "Hero Blood Donor", date: "12 May 2026", qr: "SAHARA_DONOR_ARJUN" },
    { id: "CERT-SAHARA-002", title: "Verified Volunteer", badge: "Gold Volunteer", date: "01 Jul 2026", qr: "SAHARA_VOLUNTEER_ARJUN" },
    { id: "CERT-SAHARA-003", title: "Emergency Response Contributor", badge: "Emergency Hero", date: "15 Jul 2026", qr: "SAHARA_HERO_ARJUN" },
  ]);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Active Badges State
  const [badges, setBadges] = useState<Badge[]>([
    { id: "b1", title: "Bronze Volunteer", icon: "🥉", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", description: "Completed initial onboarding and served 5 volunteer hours.", requirement: "Complete 5 hours", earnedDate: "10 Jan 2026", category: "volunteer" },
    { id: "b2", title: "Silver Volunteer", icon: "🥈", color: "text-slate-500", bgColor: "bg-slate-50", borderColor: "border-slate-200", description: "Demonstrated reliability across 15 hours of community service.", requirement: "Complete 15 hours", earnedDate: "18 Feb 2026", category: "volunteer" },
    { id: "b3", title: "Gold Volunteer", icon: "🥇", color: "text-amber-500", bgColor: "bg-amber-50/50", borderColor: "border-amber-300", description: "Top-tier service contribution, completing over 30 verified hours.", requirement: "Complete 30 hours", earnedDate: "05 Apr 2026", category: "volunteer" },
    { id: "b4", title: "Platinum Volunteer", icon: "🏅", color: "text-sky-500", bgColor: "bg-sky-50", borderColor: "border-sky-200", description: "Ultimate service milestone requiring 100 hours of active mesh service.", requirement: "Complete 100 hours", earnedDate: null, category: "volunteer" },
    { id: "b5", title: "Hero Blood Donor", icon: "❤️", color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", description: "Donated blood at a verified campaign to help secure local stocks.", requirement: "Donate Blood once", earnedDate: "12 May 2026", category: "blood" },
    { id: "b6", title: "Emergency Hero", icon: "🚑", color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200", description: "Responded rapidly to critical dispatch coordinates during a red alert.", requirement: "Resolve 5 emergency alerts", earnedDate: "15 Jun 2026", category: "emergency" },
    { id: "b7", title: "Village Guardian", icon: "👨‍🌾", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", description: "Recognized as a champion safeguarding rural agricultural zones.", requirement: "Register farm machinery for flood support", earnedDate: "02 Jul 2026", category: "guardian" },
    { id: "b8", title: "Disaster Warrior", icon: "🌊", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", description: "Successfully supported 3 flash flood rescue mock drills offline.", requirement: "Participate in 3 disaster drills", earnedDate: null, category: "disaster" },
    { id: "b9", title: "Women Safety Champion", icon: "👩", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", description: "Joined the night patrol and women's local support circle network.", requirement: "Conduct 1 safety mapping route", earnedDate: "11 Jul 2026", category: "safety" },
    { id: "b10", title: "Health Support Hero", icon: "🩺", color: "text-rose-500", bgColor: "bg-rose-50", borderColor: "border-rose-200", description: "Certified local health worker assistant supporting medication deliveries.", requirement: "Deliver 10 medicine boxes", earnedDate: null, category: "health" },
  ]);

  // Selected Badge Detail Modal
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Verification & Celebration Overlay states
  const [celebration, setCelebration] = useState<{ active: boolean; title: string; badgeTitle: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti Physics particle array
  useEffect(() => {
    if (!celebration || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = ["#F43F5E", "#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Populate confetti particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - 20,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 6 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.1 - 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeParticles = 0;

      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Update position
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Reset particle to top if it goes off bottom
        if (p.y < canvas.height) {
          activeParticles++;
        }
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [celebration]);

  // Simulate a verification and unlock a locked badge with full celebration!
  const triggerUnlockSimulation = (badgeId: string) => {
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return;

    // Trigger state changes
    setBadges(prev => prev.map(b => {
      if (b.id === badgeId) {
        return { ...b, earnedDate: "Today (Verified)" };
      }
      return b;
    }));

    // Update stats
    setReputationScore(prev => prev + 120);
    setLivesHelped(prev => prev + 1);
    setVolunteerHours(prev => prev + 6);

    // Play synthesized celebratory audio major chord!
    playSuccessSound();

    // Set celebration popup
    setCelebration({
      active: true,
      title: "Badge Verified & Unlocked!",
      badgeTitle: badge.title,
    });
    setSelectedBadge(null);
  };

  // Mock Leaderboard Data
  const leaderboardData: Record<"village" | "district" | "state" | "national", LeaderboardUser[]> = {
    village: [
      { rank: 1, name: "Harish Kurup", score: 940, livesHelped: 18, badges: ["🥇", "❤️", "👨‍🌾"], hours: 55, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 2, name: "Sunita Gokhale", score: 810, livesHelped: 16, badges: ["🥇", "👩", "🩺"], hours: 48, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 3, name: currentUser.name || "Arjun Prasad", score: reputationScore, livesHelped: livesHelped, badges: ["🥈", "❤️", "👨‍🌾", "🚑"], hours: volunteerHours, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 4, name: "Deepak Rawat", score: 620, livesHelped: 10, badges: ["🥈", "👨‍🌾"], hours: 24, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 5, name: "Kiran Deshmukh", score: 490, livesHelped: 7, badges: ["🥉", "👩"], hours: 12, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80" },
    ],
    district: [
      { rank: 1, name: "Dr. Alok Verma", score: 1850, livesHelped: 32, badges: ["🥇", "🩺", "🚑"], hours: 110, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 2, name: "Meena Swaminathan", score: 1620, livesHelped: 28, badges: ["🥇", "👩", "🌊"], hours: 95, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 28, name: currentUser.name || "Arjun Prasad", score: reputationScore, livesHelped: livesHelped, badges: ["🥈", "❤️", "👨‍🌾"], hours: volunteerHours, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" },
    ],
    state: [
      { rank: 1, name: "Inspector Vijay Salaskar", score: 3840, livesHelped: 78, badges: ["🥇", "🚑", "🌊"], hours: 240, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 145, name: currentUser.name || "Arjun Prasad", score: reputationScore, livesHelped: livesHelped, badges: ["🥈", "❤️", "👨‍🌾"], hours: volunteerHours, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" },
    ],
    national: [
      { rank: 1, name: "Captain Raghu Raman", score: 8750, livesHelped: 184, badges: ["🥇", "🚑", "🌊", "👨‍🌾"], hours: 490, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&h=80&q=80" },
      { rank: 1242, name: currentUser.name || "Arjun Prasad", score: reputationScore, livesHelped: livesHelped, badges: ["🥈", "❤️", "👨‍🌾"], hours: volunteerHours, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" },
    ]
  };

  const currentLeaderboard = leaderboardData[leaderboardFilter].filter(u => 
    u.name.toLowerCase().includes(leaderboardSearch.toLowerCase())
  );

  return (
    <div className="impact-page-shell select-none animate-fade-in text-slate-800">
      {/* Title Header Block */}
      <section className="impact-hero">
        <div className="impact-hero-copy">
          <span className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">
            ⭐ ETHICAL CITIZEN RECOGNITION
          </span>
          <h2>Small acts.<br /><span>Lasting community impact.</span></h2>
          <p>
            Sahara celebrates voluntary citizenship. Blood donation, rescue relief, and safety patrols build trust, reputations, and lifesaving credentials without monetary transactions.
          </p>
          <div className="impact-hero-stats">
            <span><strong>{reputationScore}</strong><small>reputation points</small></span>
            <span><strong>{livesHelped}</strong><small>neighbors helped</small></span>
            <span><strong>{volunteerHours}h</strong><small>given to community</small></span>
          </div>
        </div>
        <div className="impact-hero-art">
          <img src={impactIllustration} alt="A community response team working together" />
          <div className="impact-medal-card">
            <span className="impact-medal-icon"><Trophy /></span>
            <span><strong>{communityRank}</strong><small>Community standing</small></span>
            <Sparkles className="impact-medal-sparkle" />
          </div>
        </div>
      </section>

      {/* CORE PROGRESS & PERFORMANCE METRICS */}
      <section className="impact-performance bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans text-sm font-black text-slate-900">Your Citizen Reputation</h3>
          </div>
          <span className="text-xs font-mono font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-wider">
            {communityRank}
          </span>
        </div>

        {/* 6 Grid Metrics Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 text-center relative group overflow-hidden hover:bg-white hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs block">⭐</span>
            <span className="font-mono text-[8px] text-slate-400 font-bold block uppercase tracking-widest mt-1">REPUTATION SCORE</span>
            <span className="text-xl font-black text-slate-900 block mt-1 tracking-tight">{reputationScore}</span>
            <span className="text-[8px] text-emerald-600 font-extrabold mt-0.5 block">Top 2% District</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 text-center relative group overflow-hidden hover:bg-white hover:border-red-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs block">❤️</span>
            <span className="font-mono text-[8px] text-slate-400 font-bold block uppercase tracking-widest mt-1">LIVES HELPED</span>
            <span className="text-xl font-black text-slate-900 block mt-1 tracking-tight">{livesHelped}</span>
            <span className="text-[8px] text-red-500 font-extrabold mt-0.5 block">Active Sentinel</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 text-center relative group overflow-hidden hover:bg-white hover:border-orange-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs block">🚨</span>
            <span className="font-mono text-[8px] text-slate-400 font-bold block uppercase tracking-widest mt-1">DISPATCH RUNS</span>
            <span className="text-xl font-black text-slate-900 block mt-1 tracking-tight">{emergencyResponses}</span>
            <span className="text-[8px] text-orange-600 font-extrabold mt-0.5 block">100% Reliability</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 text-center relative group overflow-hidden hover:bg-white hover:border-red-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs block">🩸</span>
            <span className="font-mono text-[8px] text-slate-400 font-bold block uppercase tracking-widest mt-1">BLOOD DONATIONS</span>
            <span className="text-xl font-black text-slate-900 block mt-1 tracking-tight">{bloodDonations} Units</span>
            <span className="text-[8px] text-rose-500 font-extrabold mt-0.5 block">O+ Universal Donor</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 text-center relative group overflow-hidden hover:bg-white hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs block">🤝</span>
            <span className="font-mono text-[8px] text-slate-400 font-bold block uppercase tracking-widest mt-1">VOLUNTEER HOURS</span>
            <span className="text-xl font-black text-slate-900 block mt-1 tracking-tight">{volunteerHours} hrs</span>
            <span className="text-[8px] text-blue-600 font-extrabold mt-0.5 block">Mesh Coordinator</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5 text-center relative group overflow-hidden hover:bg-white hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs block">🏆</span>
            <span className="font-mono text-[8px] text-slate-400 font-bold block uppercase tracking-widest mt-1">COMMUNITY RANK</span>
            <span className="text-xl font-black text-slate-900 block mt-1 tracking-tight">#28 State</span>
            <span className="text-[8px] text-purple-600 font-extrabold mt-0.5 block">District Rank: #28</span>
          </div>

        </div>

        {/* Motivational message banner */}
        <div className="bg-emerald-600 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-white shadow-sm">
          <Sparkles className="w-5 h-5 text-emerald-100 shrink-0" />
          <p className="text-[11px] text-white font-medium leading-relaxed">
            🌿 <b className="text-white font-bold">"A helper of others is a guardian of India."</b> Your recent blood donation at City Blood Bank matched 1 patient, assisting in securing active health safeguards.
          </p>
        </div>
      </section>

      {/* RECOGNITION BADGE GRID SYSTEM */}
      <section className="impact-badges bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-sans text-sm font-black text-slate-900">Your Achievement Badges</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Click any badge to check verification requirements or claim simulated service achievements.</p>
        </div>

        {/* Badge List Cards */}
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-3.5 border rounded-2xl cursor-pointer text-left flex items-start gap-3 transition-all relative overflow-hidden ${
                badge.earnedDate 
                  ? `${badge.bgColor} ${badge.borderColor} shadow-sm hover:scale-[1.01]` 
                  : "bg-slate-50 border-dashed border-slate-200 opacity-50 hover:opacity-80"
              }`}
            >
              <span className="text-2xl mt-0.5 select-none shrink-0">{badge.icon}</span>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                  {badge.title}
                  {badge.earnedDate && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </h4>
                <p className="text-[9px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  {badge.description}
                </p>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[7.5px] font-bold text-slate-400 bg-slate-100/60 border border-slate-200 px-1 py-0.5 rounded uppercase">
                    {badge.earnedDate ? `Earned ${badge.earnedDate}` : "LOCKED"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD PLATFORM */}
      <section className="impact-leaderboard bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="font-sans text-sm font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Decentralized Citizen Leaderboard
          </h3>
          <p className="text-[11px] text-slate-400 leading-tight">
            Recognizing top volunteers, disaster helpers, and safety guardians across geographical tiers.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="space-y-2.5">
          {/* Geographical Filters Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {(["village", "district", "state", "national"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setLeaderboardFilter(tier)}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  leaderboardFilter === tier 
                    ? "bg-white text-slate-900 shadow-sm font-black" 
                    : "text-slate-500 hover:text-slate-950 font-bold"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Search bar inside Leaderboard */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search citizen names..."
              value={leaderboardSearch}
              onChange={(e) => setLeaderboardSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Leaderboard Table Grid */}
        <div className="space-y-2 pt-1">
          {currentLeaderboard.map((item) => (
            <div 
              key={item.rank} 
              className={`p-3 rounded-xl border flex justify-between items-center ${
                item.name.includes(currentUser.name || "Arjun") 
                  ? "bg-emerald-50/70 border-emerald-200 shadow-sm" 
                  : "bg-slate-50/50 border-slate-200/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank indicator */}
                <div className={`w-6 h-6 rounded-lg font-mono text-xs font-black flex items-center justify-center ${
                  item.rank === 1 ? "bg-amber-100 text-amber-700" :
                  item.rank === 2 ? "bg-slate-200 text-slate-700" :
                  item.rank === 3 ? "bg-orange-100 text-orange-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  #{item.rank}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-white">
                  <img src={item.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>

                {/* Name & Badges */}
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    {item.name}
                    {item.name.includes(currentUser.name || "Arjun") && (
                      <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.2 rounded uppercase font-bold">You</span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    {item.badges.map((b, idx) => (
                      <span key={idx} className="text-xs filter drop-shadow-sm select-none">{b}</span>
                    ))}
                    <span className="text-[9px] text-slate-400 font-bold font-mono uppercase ml-1">
                      {item.hours} hrs active
                    </span>
                  </div>
                </div>
              </div>

              {/* Score and stats */}
              <div className="text-right">
                <span className="text-xs font-black text-slate-900 block font-mono">{item.score} pts</span>
                <span className="text-[9px] text-slate-400 font-bold font-mono">❤️ {item.livesHelped} Saved</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIGITAL CERTIFICATES FOR VERIFIED SERVICE */}
      <section className="impact-certificates bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-sans text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Verified Digital Certificates
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Sahara issues cryptographic certificates for verified blood donations and emergency dispatches.</p>
        </div>

        {/* Certificate list layout */}
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div 
              key={cert.id} 
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center hover:bg-white hover:border-emerald-300 transition-all duration-300"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-900">{cert.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 font-bold">
                  <span>ID: {cert.id}</span>
                  <span>•</span>
                  <span>Issued: {cert.date}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCert(cert)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
              >
                View Certificate <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FUTURE REWARD ECOSYSTEM EXPLANATORY CARDS */}
      <section className="impact-ecosystem bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600 animate-bounce" />
            <h3 className="font-sans text-sm font-black text-slate-900">Volunteer Appreciation Ecosystem</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Sahara is a strict zero-payout safety network. To appreciate our dedicated contributors, partnering organizations may voluntarily sponsor the following optional benefits (not guaranteed by Sahara):
          </p>
        </div>

        {/* Grid benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          
          <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span>🏥</span>
              <h4 className="text-xs font-black text-slate-800">Hospital Medical Waivers</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              Appreciating verified blood donors with hospital network queue bypass and prioritizations.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span>🌾</span>
              <h4 className="text-xs font-black text-slate-800">CSR Sponsored Incentives</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              Corporate partners matching top village guardians with complimentary micro-irrigation accessories.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span>🤝</span>
              <h4 className="text-xs font-black text-slate-800">NGO Academic Scholarships</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              Educational aid programs matching top students who log verified weekend emergency support runs.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span>🎟️</span>
              <h4 className="text-xs font-black text-slate-800">Local Merchant Discounts</h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              Verified community volunteers receiving exclusive discounts at village diagnostic centers and pharmacies.
            </p>
          </div>

        </div>
      </section>

      {/* DETAIL BADGE MODAL OVERLAY */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 text-slate-800">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-[400px] w-full text-center space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedBadge(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 absolute right-4 top-4 font-black cursor-pointer"
              >
                ×
              </button>

              <div className="space-y-3 mt-4">
                <span className="text-5xl block animate-bounce filter drop-shadow-md">{selectedBadge.icon}</span>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedBadge.earnedDate ? "Verified Status achieved" : "Awaiting Verification"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedBadge.title}</h3>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="space-y-1 text-center">
                  <span className="font-mono text-[9px] font-bold text-slate-400 block uppercase">BADGE PURPOSE</span>
                  <p className="text-xs font-semibold leading-relaxed text-slate-700">{selectedBadge.description}</p>
                </div>

                <div className="space-y-1 text-center border-t border-slate-200/50 pt-2.5">
                  <span className="font-mono text-[9px] font-bold text-slate-400 block uppercase">REQUIREMENTS TO UNLOCK</span>
                  <p className="text-xs font-bold text-slate-800">{selectedBadge.requirement}</p>
                </div>

                {selectedBadge.earnedDate ? (
                  <div className="space-y-0.5 text-center border-t border-slate-200/50 pt-2.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 block uppercase">CREDENTIAL SEAL</span>
                    <p className="text-xs font-black text-emerald-600 flex items-center justify-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SECURE BLOCKCHAIN RECORDED
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5 text-center border-t border-slate-200/50 pt-2.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 block uppercase">CREDENTIAL STATUS</span>
                    <p className="text-xs font-black text-amber-600 flex items-center justify-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> AWAITING MESH DISPATCH RUN
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {!selectedBadge.earnedDate ? (
                  <button
                    onClick={() => triggerUnlockSimulation(selectedBadge.id)}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200"
                  >
                    <span>Simulate Verification Action</span>
                  </button>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-xl text-xs font-black">
                    ✓ Credential Locked & Active
                  </div>
                )}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-sans text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-widest"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED DIGITAL CERTIFICATE LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-[12px] border-slate-800 rounded-3xl p-6 max-w-[500px] w-full shadow-2xl relative font-sans text-slate-900 space-y-6"
            >
              {/* Gold corners */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-yellow-500" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-yellow-500" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-yellow-500" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-yellow-500" />

              <button 
                onClick={() => setSelectedCert(null)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 absolute right-4 top-4 font-black cursor-pointer"
              >
                ×
              </button>

              {/* Certificate layout */}
              <div className="text-center space-y-4 pt-4 border-2 border-dashed border-slate-200 p-4 rounded-xl">
                <span className="text-3xl block">📜</span>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] font-black text-amber-600 uppercase tracking-widest block">SAHARA SAFETY LEDGER PROTOCOL</span>
                  <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">CERTIFICATE OF RECOGNITION</h2>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">This is proudly awarded to</p>
                  <p className="text-lg font-serif font-black underline decoration-yellow-500 text-slate-900 select-all">{currentUser.name || "Arjun Prasad"}</p>
                  <p className="text-[11px] text-slate-500 max-w-[340px] mx-auto font-medium leading-relaxed">
                    for distinguished public safety contribution as a verified <b>{selectedCert.badge}</b>, safeguarding local sectors, supporting emergency dispatches, and demonstrating exceptional civic responsibility.
                  </p>
                </div>

                {/* Date and Signature Row */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-left space-y-0.5">
                    <span className="text-[8px] font-mono text-slate-400 font-bold block uppercase">VERIFICATION SEAL</span>
                    <span className="font-mono text-[9px] font-black text-emerald-600 block flex items-center gap-1 uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" /> SECURE BLOCKCHAIN
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[8px] font-mono text-slate-400 font-bold block uppercase font-bold">SAHARA NODE AUTHORITY</span>
                    <span className="font-mono text-[9px] text-slate-800 font-black block block">MESH VALIDATOR v2.4</span>
                  </div>
                </div>

                {/* QR Code and Certificate ID block */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl text-left">
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-slate-400 font-bold block uppercase">CERTIFICATE UNIQUE ID</span>
                    <span className="font-mono text-[10px] font-black text-slate-800 block select-all">{selectedCert.id}</span>
                    <span className="font-mono text-[8px] text-slate-400 block">Date Issued: {selectedCert.date}</span>
                  </div>
                  
                  {/* QR Code Graphic */}
                  <div className="w-14 h-14 bg-white border border-slate-200 p-1 rounded-lg shrink-0 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`ID=${selectedCert.id}&USER=${currentUser.name}&BADGE=${selectedCert.badge}`)}`}
                      className="w-full h-full object-contain" 
                      alt="Verification QR"
                    />
                  </div>
                </div>
              </div>

              {/* Action keys */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    const content = `SAHARA CERTIFICATE OF RECOGNITION\nID: ${selectedCert.id}\nRecipient: ${currentUser.name}\nAchievement: ${selectedCert.badge}\nDate: ${selectedCert.date}\nSecured with Sahara Decentralized Mesh Signature.`;
                    const blob = new Blob([content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `Sahara_Certificate_${selectedCert.id}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 h-11 bg-slate-900 hover:bg-slate-950 text-white font-sans text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1 shadow-md shadow-slate-200"
                >
                  <Download className="w-4 h-4 text-yellow-500" /> Download
                </button>
                <button
                  onClick={() => {
                    const text = `I am proud to receive the SAHARA Safety Recognition Certificate: ${selectedCert.title} (ID: ${selectedCert.id}) for local civic contributions.`;
                    navigator.clipboard.writeText(text);
                    alert("Certificate link and verification payload copied to clipboard!");
                  }}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-sans text-xs font-black rounded-xl transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" /> Share Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN CELEBRATION OVERLAY TRIGGER */}
      <AnimatePresence>
        {celebration && celebration.active && (
          <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 select-none">
            {/* Confetti Physics Canvas background */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

            {/* Glowing card container */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 2 }}
              className="bg-white border-[6px] border-emerald-500/30 rounded-[40px] p-8 max-w-[420px] w-full text-center space-y-6 shadow-2xl relative z-20 text-slate-800"
            >
              {/* Sparkle badge */}
              <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                🏆
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[9px] font-black text-emerald-600 uppercase tracking-widest block">
                  🛡️ Sahara Merit Verification
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Congratulations!</h2>
                <p className="text-sm font-extrabold text-emerald-600">You earned the "{celebration.badgeTitle}" Badge!</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-semibold text-slate-700 leading-relaxed text-center">
                🌾 <b>You helped save a life and protect society today!</b> Your civic contributions have been sealed cryptographically on local mesh ledger nodes.
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCelebration(null)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-black rounded-2xl transition-all cursor-pointer uppercase tracking-widest shadow-md shadow-emerald-200"
                >
                  Thank You
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
