"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/site";
import { Label, gradientBtn } from "@/components/ui";
import { RunView, ExecView, type Run, type Prepared } from "@/components/app/results";

const BRIEF: Run = {
  id: "demo-brief",
  loop: "brief",
  input: {},
  sourcesOk: 5,
  sourcesTotal: 5,
  confidence: "high",
  createdAt: "2026-06-30T12:00:00.000Z",
  markdown: `# Daily Brief — AERO, WETH, USDC

## Smart money
- **AlphaTrack**: 3 smart-money wallets accumulated **AERO** in 24h, net +$420K.

## Prices & liquidity
- **SwapCat**: AERO **$1.24** (+6.3%), pool liquidity **$8.2M** on Aerodrome.

## Events
- **Polymind**: the Aerodrome gauge vote is live, likely favoring the AERO/USDC pool.

## Market mood
- **DCA Signal**: sentiment reads **greed (71/100)**.

### Takeaway
Smart money is buying into rising liquidity while mood runs hot. **Accumulate**, and trim if the gauge vote disappoints.`,
};

const VET: Run = {
  id: "demo-vet",
  loop: "vet",
  input: {},
  sourcesOk: 3,
  sourcesTotal: 3,
  confidence: "medium",
  createdAt: "2026-06-30T12:00:00.000Z",
  markdown: `# Token Verdict — GROK9

**Verdict: Caution**

## Wallet & deployer risk
- **Web3 Risk**: deployer clean, no honeypot signature.

## Contract audit
- **ChainGuard**: verified, no mint or blacklist, ownership renounced.

## Liquidity & taxes
- **SwapCat**: liquidity **$1.2M**, but a **3% transfer tax** applies.

### Takeaway
No hard red flags, but the **3% tax** and thin liquidity warrant caution. Size small.`,
};

const SWAP: Prepared = {
  ok: true,
  tokenSymbol: "AERO",
  tokenOut: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
  tokenVerified: true,
  recipient: "0x86410d8c1b9b0a3a0b0e0c0d0e0f000000000000",
  principalAmount: 25,
  slippageBps: 100,
  storeUrl: "https://agent.croo.network/agents/70b70042-7cdd-4e6b-bebf-7abd25a22d83",
  order: { principal_amount: 25, token_out: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", recipient: "0x86410d8c1b9b0a3a0b0e0c0d0e0f000000000000", slippage_bps: 100 },
};

type Mode = "brief" | "vet" | "execute";
type Status = "idle" | "running" | "done";
type Result = { kind: "run"; run: Run } | { kind: "exec"; prepared: Prepared } | null;

const inputCls = "w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none placeholder:text-neutral-600 focus:border-accent/50";

export default function DemoRun() {
  const [mode, setMode] = useState<Mode>("brief");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result>(null);

  const [tokens, setTokens] = useState("AERO, WETH, USDC");
  const [vetToken, setVetToken] = useState("0x9a1c…d2f3 (GROK9)");
  const [exToken, setExToken] = useState("AERO");
  const [exAmount, setExAmount] = useState("25");
  const [exRecipient, setExRecipient] = useState("0x86410d8c1b9b0a3a0b0e0c0d0e0f000000000000");

  function run() {
    setStatus("running");
    setResult(null);
    const delay = mode === "execute" ? 700 : 1700;
    window.setTimeout(() => {
      setResult(mode === "brief" ? { kind: "run", run: BRIEF } : mode === "vet" ? { kind: "run", run: VET } : { kind: "exec", prepared: SWAP });
      setStatus("done");
    }, delay);
  }

  function pick(m: Mode) {
    setMode(m);
    setStatus("idle");
    setResult(null);
  }

  const cta = mode === "brief" ? "Run brief" : mode === "vet" ? "Vet token" : "Prepare swap";

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-16">
          <Label>Demo mode</Label>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Try Capo without spending</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-400">
            Pick a job, fill it in, and run it. Everything here is simulated with sample data — nothing is charged and nothing is placed on-chain.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
            {(["brief", "vet", "execute"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => pick(m)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${mode === m ? "bg-[#0d9488] text-white" : "text-neutral-400 hover:text-white"}`}
              >
                {m === "brief" ? "Daily Brief" : m === "vet" ? "Vet Token" : "Execute"}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            {/* Form */}
            <div className="glass p-5">
              {mode === "brief" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs leading-relaxed text-neutral-500">Smart money, prices, events, and mood across your watchlist, in one brief.</p>
                  <Field label="Watchlist tokens">
                    <input value={tokens} onChange={(e) => setTokens(e.target.value)} className={inputCls} />
                  </Field>
                </div>
              )}
              {mode === "vet" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs leading-relaxed text-neutral-500">A safe / caution / scam verdict from risk, audit, and liquidity.</p>
                  <Field label="Token address or symbol">
                    <input value={vetToken} onChange={(e) => setVetToken(e.target.value)} className={inputCls} />
                  </Field>
                </div>
              )}
              {mode === "execute" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs leading-relaxed text-neutral-500">Capo prepares a SwapGod order. In the real app you place it yourself, from your wallet.</p>
                  <Field label="Buy token">
                    <input value={exToken} onChange={(e) => setExToken(e.target.value)} className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Amount (USDC)">
                      <input value={exAmount} onChange={(e) => setExAmount(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Slippage %">
                      <input defaultValue="1" className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Recipient wallet">
                    <input value={exRecipient} onChange={(e) => setExRecipient(e.target.value)} className={`${inputCls} font-mono text-xs`} />
                  </Field>
                </div>
              )}

              <button
                onClick={run}
                disabled={status === "running"}
                className={`${gradientBtn} mt-5 w-full px-5 py-2.5 text-sm`}
              >
                {status === "running" ? "Running…" : `${cta} (demo)`}
              </button>
            </div>

            {/* Result */}
            <div className="glass p-5">
              {status === "idle" && (
                <div className="flex h-full min-h-[16rem] items-center justify-center px-6 text-center text-sm text-neutral-600">
                  Fill in the form and run it to see a sample result here.
                </div>
              )}
              {status === "running" && (
                <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  <p className="text-sm text-neutral-400">
                    {mode === "execute" ? "Preparing the swap…" : "Capo is hiring the crew and synthesizing…"}
                  </p>
                </div>
              )}
              {status === "done" && result?.kind === "run" && <RunView run={result.run} />}
              {status === "done" && result?.kind === "exec" && <ExecView prepared={result.prepared} />}
            </div>
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            Ready for the real thing?{" "}
            <Link href="/app" className="text-accent hover:underline">
              Open the app →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium text-neutral-200">{label}</div>
      {children}
    </label>
  );
}
