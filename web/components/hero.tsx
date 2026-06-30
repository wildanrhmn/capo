"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";

const CX = 300;
const CY = 300;
const R = 214;
const COUNT = 7;
const NODES = Array.from({ length: COUNT }, (_, i) => {
  const a = (-90 + (360 / COUNT) * i) * (Math.PI / 180);
  return { x: +(CX + R * Math.cos(a)).toFixed(1), y: +(CY + R * Math.sin(a)).toFixed(1) };
});

export function Hero({ crew }: { crew: string[] }) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 1 } }
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: EASE } };

  return (
    <section className="relative overflow-hidden">
      {/* Drifting auroras */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand/15 blur-[150px]"
        animate={reduce ? {} : { x: [0, 40, 0], y: [0, 22, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[150px]"
        animate={reduce ? {} : { x: [0, -34, 0], y: [0, 30, 0] }}
        transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="dotgrid pointer-events-none absolute inset-0 opacity-25" />

      {/* Orbital orchestration backdrop */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
        <svg
          viewBox="0 0 600 600"
          className="h-[660px] w-[660px] max-w-none opacity-80 [mask-image:radial-gradient(circle,black_30%,transparent_70%)]"
          aria-hidden
        >
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={140} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {NODES.map((n, i) => (
            <line key={`s${i}`} x1={CX} y1={CY} x2={n.x} y2={n.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {NODES.map((n, i) => (
            <motion.circle
              key={`n${i}`}
              cx={n.x}
              cy={n.y}
              r="4"
              fill="#22d3ee"
              animate={reduce ? { opacity: 0.5 } : { opacity: [0.25, 0.7, 0.25] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}
          {!reduce &&
            NODES.map((n, i) => (
              <motion.circle
                key={`p${i}`}
                r="3"
                fill="#8b7cf6"
                initial={{ cx: CX, cy: CY, opacity: 0 }}
                animate={{ cx: [CX, n.x], cy: [CY, n.y], opacity: [0, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 0.6 + i * 0.32, ease: "easeOut" }}
              />
            ))}
          <circle cx={CX} cy={CY} r="20" fill="#8b7cf6" opacity="0.18" />
          <circle cx={CX} cy={CY} r="9" fill="#8b7cf6" />
          <circle cx={CX} cy={CY} r="9" fill="none" stroke="#b3a6fb" strokeWidth="1.5" strokeOpacity="0.6" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-36 text-center sm:pt-44">
        <motion.span {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Built on the CROO store</span>
        </motion.span>

        <motion.h1 {...rise(0.08)} className="mt-8 text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
          <span className="block">Ask once.</span>
          <span className="block">
            Capo hires the <span className="font-display italic text-brand">crew</span>.
          </span>
          <span className="block text-neutral-500">You read one brief.</span>
        </motion.h1>

        <motion.p {...rise(0.18)} className="mt-8 max-w-xl text-pretty text-base leading-relaxed text-neutral-400 sm:text-lg">
          Capo is an on-chain copilot that puts the CROO store&apos;s best specialist agents to work — smart money,
          prices, events, mood, and risk — hands back one synthesized answer, then preps the swap when you&apos;re ready to act.
        </motion.p>

        <motion.div {...rise(0.28)} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href={STORE} target="_blank" rel="noreferrer" className="btn-brand px-6 py-3">
            Get a Pass on CROO
          </a>
          <Link href="/app" className="btn-ghost px-6 py-3">
            I have a code →
          </Link>
        </motion.div>

        <motion.div {...rise(0.4)} className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {crew.map((name) => (
            <span key={name} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-600">
              <span className="h-1 w-1 rounded-full bg-neutral-600" />
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
