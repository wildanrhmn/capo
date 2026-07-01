"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";
const EASE = [0.22, 1, 0.36, 1] as const;

// Single source of truth for the accent — change this to reskin the whole site.
const ACCENT = {
  text: "#2dd4bf",
  primary: "#14b8a6",
  glow: "rgba(20, 184, 166, 0.16)",
  border: "rgba(20, 184, 166, 0.22)",
  button: "bg-[#0d9488] hover:bg-[#0f766e]",
  shadow: "shadow-teal-900/40",
};

export interface Stats {
  completedOrders: number;
  totalVolume: string;
  completionRate: string;
}

export interface Agent {
  name: string;
  role: string;
  loop: string;
}

function AnimatedWord({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.1em]">
      <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: "0%" }} transition={{ duration: 0.85, delay, ease: EASE }}>
        {text}
      </motion.span>
    </span>
  );
}

function ParticleField() {
  const [dots, setDots] = useState<{ left: number; top: number; on: boolean; dur: number; delay: number }[]>([]);
  useEffect(() => {
    setDots(
      Array.from({ length: 44 }, (_, i) => ({
        left: (i * 47) % 100,
        top: (i * 71) % 100,
        on: i % 3 === 0,
        dur: 3 + ((i * 13) % 40) / 10,
        delay: ((i * 29) % 50) / 10,
      })),
    );
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute h-[2px] w-[2px] rounded-full"
          style={{ left: `${d.left}%`, top: `${d.top}%`, background: d.on ? ACCENT.primary : "rgba(255,255,255,0.15)" }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function OrbitalRing({ size, duration, delay = 0 }: { size: number; duration: number; delay?: number }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 rounded-full border"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderColor: ACCENT.border }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
      <motion.span
        className="absolute h-2 w-2 rounded-full"
        style={{ background: ACCENT.primary, top: -4, left: "50%", marginLeft: -4 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-white/[0.05] bg-[#030305]/80 backdrop-blur-2xl" : ""}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/capo.svg" alt="Capo" className="h-8 w-8 rounded-lg" />
          <span className="text-[15px] font-semibold tracking-tight text-white">Capo</span>
        </Link>
        <nav className="hidden items-center gap-10 text-[13px] font-medium text-white/40 md:flex">
          <a href="#loop" className="transition-colors hover:text-white">How it works</a>
          <a href="#jobs" className="transition-colors hover:text-white">Capabilities</a>
          <a href="#crew" className="transition-colors hover:text-white">The crew</a>
          <a href="#proof" className="transition-colors hover:text-white">On-chain</a>
        </nav>
        <a
          href={STORE}
          target="_blank"
          rel="noreferrer"
          className={`rounded-full ${ACCENT.button} px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg ${ACCENT.shadow} transition-all`}
        >
          Get a Pass
        </a>
      </div>
    </header>
  );
}

function Hero({ stats }: { stats: Stats | null }) {
  const proof = [
    { value: "8", label: "Specialist agents" },
    { value: stats ? `${Math.round(Number(stats.completionRate))}%` : "100%", label: "Completion" },
    { value: "Base", label: "Settles on" },
  ];
  return (
    <section className="hero-gradient relative flex min-h-screen items-center justify-center overflow-hidden">
      <ParticleField />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="absolute left-1/2 top-1/2">
        <OrbitalRing size={420} duration={32} />
        <OrbitalRing size={580} duration={46} delay={2} />
        <OrbitalRing size={740} duration={62} delay={4} />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${ACCENT.glow} 0%, transparent 70%)` }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-20 text-center">
        <h1 className="text-[clamp(2.8rem,8vw,6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-white">
          <AnimatedWord text="Ask once." delay={0.2} />
          <br />
          <span className="text-gradient">
            <AnimatedWord text="Capo hires the crew." delay={0.4} />
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mx-auto mt-8 max-w-2xl text-[18px] font-light leading-relaxed text-white/45 sm:text-[20px]"
        >
          An on-chain copilot that puts the CROO store&apos;s specialist agents to work, pays each in USDC, and returns one
          synthesized answer — a brief, a token verdict, or a ready-to-place swap.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-12 flex items-center justify-center gap-4"
        >
          <a
            href={STORE}
            target="_blank"
            rel="noreferrer"
            className={`group rounded-full ${ACCENT.button} px-8 py-4 text-[14px] font-semibold text-white shadow-2xl ${ACCENT.shadow} transition-all hover:-translate-y-0.5`}
          >
            Get a Pass on CROO
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </a>
          <Link href="/demo/run" className="rounded-full border border-white/[0.08] px-8 py-4 text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.02] hover:text-white/80">
            See it work
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
          className="mx-auto mt-24 grid max-w-xl grid-cols-3 gap-12"
        >
          {proof.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{s.value}</p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/30">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="h-12 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${ACCENT.primary}66, transparent)` }} />
      </motion.div>
    </section>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: ACCENT.text }}>{eyebrow}</p>
      <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.1] tracking-tight text-white">{title}</h2>
      {sub ? <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/40">{sub}</p> : null}
    </div>
  );
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay, ease: EASE }} className={className}>
      {children}
    </motion.div>
  );
}

const STEPS = [
  { num: "01", title: "Ask", desc: "Save a watchlist, drop a token to vet, or set up a swap. One question is all it takes." },
  { num: "02", title: "Hire the crew", desc: "Capo fans out to the store's specialist agents, negotiating and paying each on-chain." },
  { num: "03", title: "Pay per call", desc: "Every agent is paid in USDC, per call, on Base. No subscriptions, no idle seats." },
  { num: "04", title: "One answer", desc: "Capo synthesizes every reply into a single attributed brief, verdict, or prepared trade." },
];

function Loop() {
  return (
    <section id="loop" className="relative px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHead eyebrow="How it works" title={<>One question in.<br /><span className="text-white/40">One answer out.</span></>} />
        </Reveal>
        <div className="mt-16">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.08}>
              <div className="group flex items-start gap-8 border-b border-white/[0.05] py-9 transition-colors duration-500 hover:border-teal-500/25">
                <span className="mt-1 shrink-0 font-mono text-[11px] text-white/25">{s.num}</span>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-teal-300">{s.title}</h3>
                  <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/40">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const JOBS = [
  { kicker: "Know", title: "Daily Brief", desc: "Smart money, prices, events, and mood across your watchlist, synthesized into one brief.", metric: "5 sources, one verdict" },
  { kicker: "Judge", title: "Vet a Token", desc: "Wallet risk, contract audit, and liquidity weighed into a safe / caution / scam verdict.", metric: "3 specialists, one call" },
  { kicker: "Act", title: "Execute a Swap", desc: "Capo prepares the trade through SwapGod. You place it from your wallet, never held by Capo.", metric: "Non-custodial, on Base" },
];

function Jobs() {
  return (
    <section id="jobs" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="text-center">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: ACCENT.text }}>Capabilities</p>
            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-tight text-white">Know it. Judge it. Act on it.</h2>
          </div>
        </Reveal>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {JOBS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <div className="group flex h-full flex-col rounded-2xl border border-white/[0.05] bg-white/[0.01] p-8 transition-all duration-500 hover:border-teal-500/25 hover:bg-teal-500/[0.02]">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: ACCENT.text }}>{c.kicker}</span>
                <h3 className="mt-4 text-lg font-semibold text-white transition-colors group-hover:text-teal-200">{c.title}</h3>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-white/35">{c.desc}</p>
                <p className="mt-6 font-mono text-[11px] text-teal-300/60">{c.metric}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Crew({ crew }: { crew: Agent[] }) {
  const groups = [
    { label: "Signals", items: crew.filter((a) => a.loop === "brief").map((a) => a.name) },
    { label: "Risk & audit", items: crew.filter((a) => a.loop === "vet").map((a) => a.name) },
    { label: "Execution", items: crew.filter((a) => a.loop === "execute").map((a) => a.name) },
  ];
  return (
    <section id="crew" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="text-center">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: ACCENT.text }}>The crew</p>
            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-tight text-white">A crew, not a chatbot.</h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/40">
              Each agent does one thing well. Capo splits the work, pays them per call, and synthesizes the replies.
            </p>
          </div>
        </Reveal>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {groups.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.1}>
              <div className="group h-full rounded-2xl border border-white/[0.05] bg-white/[0.01] p-8 transition-all duration-500 hover:border-teal-500/25">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: ACCENT.primary, opacity: 0.7 }} />
                  <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/50">{g.label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((name) => (
                    <span key={name} className="rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-white/50 transition-colors duration-300 group-hover:border-teal-500/10 group-hover:text-teal-200/70">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Proof({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const items = [
    { value: String(stats.completedOrders), label: "Orders filled" },
    { value: `$${(Number(stats.totalVolume) / 1e6).toFixed(2)}`, label: "USDC volume" },
    { value: `${Math.round(Number(stats.completionRate))}%`, label: "Completion" },
  ];
  return (
    <section id="proof" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="text-center">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: ACCENT.text }}>On-chain</p>
            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-tight text-white">Real orders. Real USDC.</h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass mt-14 grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {items.map((s) => (
              <div key={s.label} className="px-6 py-12 text-center">
                <p className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">{s.value}</p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-40">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${ACCENT.glow} 0%, transparent 70%)` }} />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.05] tracking-tight text-white">
          Stop juggling tabs.
          <br />
          <span className="text-gradient">Put a copilot on it.</span>
        </h2>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href={STORE}
            target="_blank"
            rel="noreferrer"
            className={`rounded-full ${ACCENT.button} px-8 py-4 text-[14px] font-semibold text-white shadow-2xl ${ACCENT.shadow} transition-all hover:-translate-y-0.5`}
          >
            Get a Pass on CROO
          </a>
          <Link href="/app" className="rounded-full border border-white/[0.08] px-8 py-4 text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:text-white/80">
            Open the app
          </Link>
        </div>
      </Reveal>
      <footer className="relative mx-auto mt-32 flex max-w-7xl flex-col gap-3 border-t border-white/[0.05] px-2 pt-8 text-[13px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
        <span>Capo — an on-chain crypto copilot on CROO. Built on CAP, Base mainnet, USDC.</span>
        <div className="flex gap-5">
          <Link href="/demo/run" className="transition-colors hover:text-white/60">Demo</Link>
          <a href="https://github.com/wildanrhmn/capo" target="_blank" rel="noreferrer" className="transition-colors hover:text-white/60">GitHub</a>
        </div>
      </footer>
    </section>
  );
}

export function Landing({ stats, crew }: { stats: Stats | null; crew: Agent[] }) {
  return (
    <main className="relative overflow-hidden bg-[#030305]">
      <Header />
      <Hero stats={stats} />
      <Loop />
      <Jobs />
      <Crew crew={crew} />
      <Proof stats={stats} />
      <FooterCTA />
    </main>
  );
}
