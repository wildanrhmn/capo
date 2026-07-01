"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Panel } from "./ui";

interface CrewItem {
  name: string;
  result: string;
  fee: string;
}

interface Scenario {
  key: "brief" | "vet";
  tab: string;
  stage: string;
  query: { verb: string; text: string };
  rail: { label: string; sub: string }[];
  crew: CrewItem[];
  result: React.ReactNode;
}

const BriefResult = (
  <div className="rounded-xl border border-brand/25 bg-gradient-to-b from-brand/[0.07] to-transparent p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-white">AERO</span>
        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">Accumulate</span>
      </div>
      <span className="font-mono text-[11px] text-neutral-400">confidence 78%</span>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-neutral-300">
      Smart money is buying into rising liquidity while mood runs hot — scale in, and watch the gauge vote.
    </p>
    <div className="mt-2.5 flex items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-accent/60" />
      ))}
      <span className="ml-1 text-[10px] text-neutral-500">5 sources</span>
    </div>
  </div>
);

const VetResult = (
  <div className="rounded-xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/[0.06] to-transparent p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-white">GROK9</span>
        <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-yellow-300">Caution</span>
      </div>
      <span className="font-mono text-[11px] text-neutral-400">confidence 64%</span>
    </div>
    <ul className="mt-2 space-y-1 text-xs leading-relaxed text-neutral-300">
      <li>• 3% transfer tax on every trade</li>
      <li>• Liquidity is thin for the market cap</li>
    </ul>
    <div className="mt-2.5 flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-accent/60" />
      ))}
      <span className="ml-1 text-[10px] text-neutral-500">3 sources</span>
    </div>
  </div>
);

const SCENARIOS: Record<"brief" | "vet", Scenario> = {
  brief: {
    key: "brief",
    tab: "Daily Brief",
    stage: "Daily Brief",
    query: { verb: "ask", text: "watchlist: AERO · ETH · USDC" },
    rail: [
      { label: "You ask", sub: "A watchlist of tokens" },
      { label: "Capo hires the crew", sub: "Pays each specialist in USDC" },
      { label: "One brief comes back", sub: "Synthesized and attributed" },
    ],
    crew: [
      { name: "AlphaTrack", result: "3 smart wallets bought AERO", fee: "$0.05" },
      { name: "SwapCat", result: "$1.24 · liquidity $8.2M", fee: "$0.04" },
      { name: "Polymind", result: "Aerodrome gauge vote is live", fee: "$0.06" },
      { name: "DCA Signal", result: "Market mood: greed 71", fee: "$0.05" },
      { name: "WhaleScope", result: "2 whales opened longs", fee: "$0.10" },
    ],
    result: BriefResult,
  },
  vet: {
    key: "vet",
    tab: "Vet a Token",
    stage: "Token Vet",
    query: { verb: "vet", text: "0x9a1c…d2f3 · GROK9" },
    rail: [
      { label: "You ask", sub: "One token to vet" },
      { label: "Capo checks it out", sub: "Risk, audit, and liquidity" },
      { label: "One verdict comes back", sub: "Safe / caution / scam" },
    ],
    crew: [
      { name: "Web3 Risk", result: "Deployer clean, no honeypot", fee: "$0.10" },
      { name: "ChainGuard", result: "Verified, no mint or blacklist", fee: "$0.06" },
      { name: "SwapCat", result: "Liquidity $1.2M · 3% tax", fee: "$0.04" },
    ],
    result: VetResult,
  },
};

const STEPS = 15;
const TICK = 560;

export function FlowDemo() {
  const reduce = useReducedMotion();
  const [scen, setScen] = useState<"brief" | "vet">("brief");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStep(13);
      return;
    }
    setStep(0);
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS), TICK);
    return () => clearInterval(id);
  }, [reduce, scen]);

  const s = SCENARIOS[scen];
  const crewLen = s.crew.length;
  const queryVisible = step >= 1;
  const crewRevealed = step < 3 ? 0 : Math.min(crewLen, step - 2);
  const dispatching = step >= 2 && step <= 10;
  const resultVisible = step >= 11;
  const phase = step <= 2 ? 0 : step <= 10 ? 1 : 2;

  return (
    <div>
      {/* Scenario toggle */}
      <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
        {(["brief", "vet"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setScen(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${scen === k ? "bg-brand text-white" : "text-neutral-400 hover:text-white"}`}
          >
            {SCENARIOS[k].tab}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        {/* Narration rail */}
        <ol className="flex flex-col gap-2">
          {s.rail.map((r, i) => {
            const state = phase > i ? "done" : phase === i ? "active" : "todo";
            return (
              <li
                key={r.label}
                className={`rounded-2xl border px-4 py-4 transition-colors duration-500 ${
                  state === "active" ? "border-brand/40 bg-brand/[0.06]" : "border-white/[0.06] bg-white/[0.01]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-medium transition-colors ${
                      state === "done"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : state === "active"
                          ? "border-brand/50 bg-brand/15 text-brand"
                          : "border-white/10 text-neutral-600"
                    }`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <span className={`text-sm font-medium transition-colors ${state === "todo" ? "text-neutral-400" : "text-white"}`}>{r.label}</span>
                  {state === "active" && !reduce ? (
                    <span className="ml-auto flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="h-1 w-1 rounded-full bg-brand"
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                        />
                      ))}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 pl-9 text-xs leading-relaxed text-neutral-500">{r.sub}</p>
              </li>
            );
          })}
        </ol>

        {/* Animated stage */}
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">Live run · {s.stage}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Base mainnet
            </span>
          </div>

          {/* Query */}
          <div className="mt-4 h-9">
            <AnimatePresence mode="wait">
              {queryVisible && (
                <motion.div
                  key={`${scen}-query`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-neutral-300"
                >
                  <span className="text-neutral-500">{s.query.verb}</span>
                  {s.query.text}
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
              {dispatching && <span className="absolute inset-0 -z-10 rounded-full bg-brand/20 blur-md" aria-hidden />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/capo.svg" alt="" width={18} height={18} className="rounded" />
              <span className="text-xs font-semibold text-brand">Capo</span>
            </motion.div>
          </div>

          {/* Crew */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {s.crew.map((c, i) => {
              const on = i < crewRevealed;
              return (
                <motion.div
                  key={`${scen}-${c.name}`}
                  animate={{ opacity: on ? 1 : 0.4 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl border px-3 py-2.5 transition-colors duration-300 ${on ? "border-accent/25 bg-accent/[0.04]" : "border-white/[0.06] bg-white/[0.01]"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-neutral-200">{c.name}</span>
                    {on ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-full bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] text-brand"
                      >
                        paid {c.fee}
                      </motion.span>
                    ) : (
                      <span className="font-mono text-[10px] text-neutral-600">queued</span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-neutral-400">{on ? c.result : "awaiting dispatch"}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Result */}
          <div className="mt-3 min-h-[6rem]">
            <AnimatePresence mode="wait">
              {resultVisible && (
                <motion.div key={`${scen}-result`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4 }}>
                  {s.result}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </div>
    </div>
  );
}
