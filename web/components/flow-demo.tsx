"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Panel } from "./ui";

const CREW = [
  { name: "AlphaTrack", result: "3 smart wallets bought AERO", fee: "$0.05" },
  { name: "SwapCat", result: "$1.24 · liquidity $8.2M", fee: "$0.04" },
  { name: "Polymind", result: "Aerodrome gauge vote is live", fee: "$0.06" },
  { name: "DCA Signal", result: "Market mood: greed 71", fee: "$0.05" },
  { name: "WhaleScope", result: "2 whales opened longs", fee: "$0.10" },
];

const RAIL = [
  { n: "01", label: "You ask", sub: "A watchlist, or one token to vet" },
  { n: "02", label: "Capo hires the crew", sub: "Pays each specialist in USDC, per call" },
  { n: "03", label: "One brief comes back", sub: "Synthesized, attributed, saved" },
];

const STEPS = 15;
const TICK = 560;

export function FlowDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? 13 : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS), TICK);
    return () => clearInterval(id);
  }, [reduce]);

  const queryVisible = step >= 1;
  const crewRevealed = step < 3 ? 0 : Math.min(CREW.length, step - 2);
  const dispatching = step >= 2 && step <= 9;
  const briefVisible = step >= 11;
  const phase = step <= 2 ? 0 : step <= 10 ? 1 : 2;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
      {/* Narration rail */}
      <ol className="flex flex-col gap-2">
        {RAIL.map((r, i) => {
          const active = phase === i;
          return (
            <li
              key={r.n}
              className={`rounded-2xl border px-4 py-4 transition-colors duration-500 ${
                active ? "border-brand/40 bg-brand/[0.06]" : "border-white/[0.06] bg-white/[0.01]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono text-xs transition-colors ${active ? "text-brand" : "text-neutral-600"}`}>{r.n}</span>
                <span className={`text-sm font-medium transition-colors ${active ? "text-white" : "text-neutral-400"}`}>{r.label}</span>
              </div>
              <p className="mt-1 pl-7 text-xs leading-relaxed text-neutral-500">{r.sub}</p>
            </li>
          );
        })}
      </ol>

      {/* Animated stage */}
      <Panel className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">Live run</span>
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Base mainnet
          </span>
        </div>

        {/* Query */}
        <div className="mt-4 h-9">
          <AnimatePresence>
            {queryVisible && (
              <motion.div
                key="query"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-neutral-300"
              >
                <span className="text-neutral-500">ask</span>
                watchlist: AERO · ETH · USDC
                <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-brand" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hub */}
        <div className="relative mt-4 flex justify-center">
          <motion.div
            animate={dispatching ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.9, repeat: dispatching ? Infinity : 0 }}
            className="relative flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.08] px-4 py-2"
          >
            {dispatching && (
              <span className="absolute inset-0 -z-10 rounded-full bg-brand/20 blur-md" aria-hidden />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/capo.svg" alt="" width={18} height={18} className="rounded" />
            <span className="text-xs font-semibold text-brand">Capo</span>
          </motion.div>
        </div>

        {/* Crew */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {CREW.map((c, i) => {
            const on = i < crewRevealed;
            return (
              <motion.div
                key={c.name}
                animate={{ opacity: on ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                  on ? "border-accent/25 bg-accent/[0.04]" : "border-white/[0.06] bg-white/[0.01]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-200">{c.name}</span>
                  <AnimatePresence mode="wait">
                    {on ? (
                      <motion.span
                        key="fee"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-full bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] text-brand"
                      >
                        paid {c.fee}
                      </motion.span>
                    ) : (
                      <span key="q" className="font-mono text-[10px] text-neutral-600">queued</span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-1 truncate text-[11px] text-neutral-400">{on ? c.result : "awaiting dispatch"}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Brief */}
        <div className="mt-3 min-h-[5.5rem]">
          <AnimatePresence>
            {briefVisible && (
              <motion.div
                key="brief"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-brand/25 bg-gradient-to-b from-brand/[0.07] to-transparent p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-white">AERO</span>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                      Accumulate
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">confidence 78%</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                  Smart money is buying into rising liquidity while mood runs hot — scale in, and watch the gauge vote.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  {CREW.map((c) => (
                    <span key={c.name} className="h-1.5 w-1.5 rounded-full bg-accent/60" title={c.name} />
                  ))}
                  <span className="ml-1 text-[10px] text-neutral-500">5 sources</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Panel>
    </div>
  );
}
