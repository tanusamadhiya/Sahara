import { AlertTriangle, ShieldCheck, ArrowRight, Shield, MapPin, Radio, HeartPulse, Flame, CloudLightning, Siren } from "lucide-react";

interface EmergencyLandingPageProps {
  onTriggerSOS: () => void;
  onGoToAuth: () => void;
}

export default function EmergencyLandingPage({ onTriggerSOS, onGoToAuth }: EmergencyLandingPageProps) {
  return (
    <div className="sahara-landing select-none">
      <div className="sahara-utility-bar px-5 py-2 text-xs">
        <div className="sahara-section flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> Sahara Emergency Response Network</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Network status: Operational</span>
        </div>
      </div>

      <header className="sahara-site-header sticky top-0 z-30 px-5">
        <div className="sahara-section flex h-[76px] items-center justify-between gap-6">
          <a href="#top" className="flex shrink-0 items-center gap-3 no-underline">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#173f73] text-xl font-black text-white shadow-sm">S</span>
            <span className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900">SAHARA</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Emergency services</span>
            </span>
          </a>
          <nav className="sahara-site-nav flex items-center gap-8 text-sm font-semibold">
            <a href="#services" className="no-underline">Emergency services</a>
            <a href="#preparedness" className="no-underline">Preparedness</a>
            <a href="#about" className="no-underline">About Sahara</a>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <button onClick={onGoToAuth} className="hidden rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:inline-flex">Sign in</button>
            <button onClick={onGoToAuth} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">My account</button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="sahara-hero px-5 py-12 sm:py-16 lg:py-20">
          <div className="sahara-section grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm">
                <ShieldCheck className="h-4 w-4" /> Public emergency response &amp; community safety
              </div>
              <h1 className="max-w-xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
                Help is closer than you think.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Connect with emergency responders, local services and your community when every moment matters.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={onTriggerSOS} className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-md bg-[#b42318] px-6 py-3 text-left text-white shadow-md transition hover:bg-[#991b1b]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><AlertTriangle className="h-5 w-5 text-white" /></span>
                  <span><span className="block text-[10px] font-bold uppercase tracking-[.13em] text-red-100">Immediate assistance</span><span className="block text-base font-extrabold text-white">Request emergency help</span></span>
                  <ArrowRight className="ml-2 h-5 w-5 transition group-hover:translate-x-1" />
                </button>
                <a href="#services" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">
                  Explore services <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Shield className="h-4 w-4 text-emerald-700" /> No account needed to request emergency assistance.</p>
            </div>

            <div className="sahara-hero-art relative min-h-[330px] overflow-hidden rounded-2xl border border-blue-100 p-5 sm:min-h-[390px] sm:p-8">
              <div className="absolute -right-10 -top-12 h-64 w-64 rounded-full bg-white/50 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-blue-100/70 to-transparent" />
              <div className="relative flex h-full min-h-[290px] items-center justify-center">
                <div className="absolute left-[12%] top-[18%] h-40 w-40 rounded-full border border-blue-300/50" />
                <div className="absolute left-[18%] top-[24%] h-28 w-28 rounded-full border border-blue-300/70" />
                <div className="absolute left-[25%] top-[33%] h-14 w-14 rounded-full bg-blue-600/10" />
                <div className="absolute left-[35%] top-[32%] flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg"><MapPin className="h-5 w-5" /></div>
                <div className="absolute right-[12%] top-[12%] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Response network online</div>
                <div className="sahara-alert-card absolute bottom-5 left-4 right-4 rounded-xl border border-slate-200 bg-white p-4 sm:bottom-8 sm:left-8 sm:right-8 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700"><Siren className="h-5 w-5" /></div>
                      <div><p className="text-sm font-extrabold text-slate-900">One place for urgent help</p><p className="mt-1 text-xs leading-5 text-slate-500">Share your location and connect with the right response service.</p></div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                    <div><span className="block text-sm font-extrabold text-slate-800">24/7</span><span className="text-[10px] text-slate-500">Assistance</span></div>
                    <div><span className="block text-sm font-extrabold text-slate-800">Local</span><span className="text-[10px] text-slate-500">Response</span></div>
                    <div><span className="block text-sm font-extrabold text-slate-800">Secure</span><span className="text-[10px] text-slate-500">Your details</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="px-5 py-14 sm:py-16">
          <div className="sahara-section">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#b93815]">Services and support</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Find the help you need</h2></div>
              <p className="max-w-md text-sm leading-6 text-slate-500">Choose the right route for your situation. In an emergency, request help immediately.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: HeartPulse, title: "Medical assistance", detail: "Ambulance and nearby health support", tone: "bg-rose-50 text-rose-700" },
                { icon: ShieldCheck, title: "Police & safety", detail: "Reach safety and protection services", tone: "bg-blue-50 text-blue-700" },
                { icon: Flame, title: "Fire & rescue", detail: "Fire, accident and rescue response", tone: "bg-orange-50 text-orange-700" },
                { icon: CloudLightning, title: "Disaster support", detail: "Weather alerts and community response", tone: "bg-amber-50 text-amber-700" },
              ].map(({ icon: Icon, title, detail, tone }) => (
                <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
                  <h3 className="font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="preparedness" className="border-y border-slate-200 bg-slate-50 px-5 py-12 sm:py-14">
          <div className="sahara-section grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-blue-800">Be ready before an emergency</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900">Prepared communities are safer communities.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Set up your health information, emergency contacts and family circle so responders can act with the information they need.</p></div>
            <button onClick={onGoToAuth} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#173f73] px-5 py-3 text-sm font-bold text-white hover:bg-[#12345e]">Get started <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      </main>

      <footer id="about" className="bg-[#102b4c] px-5 py-8 text-white">
        <div className="sahara-section flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg font-black text-white">S</span><div><p className="font-extrabold text-white">SAHARA Emergency Services</p><p className="mt-1 text-xs text-blue-100">A connected response network for every community.</p></div></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-blue-100"><a href="#services" className="text-blue-100 no-underline hover:text-white">Services</a><a href="#preparedness" className="text-blue-100 no-underline hover:text-white">Preparedness</a><button onClick={onGoToAuth} className="text-blue-100 hover:text-white">Sign in</button></div>
        </div>
      </footer>
    </div>
  );
}
