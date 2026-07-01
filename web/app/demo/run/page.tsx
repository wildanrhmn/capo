"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/site";
import { Panel, Pill } from "@/components/ui";
import { RunView, ExecView, type Run, type Prepared } from "@/components/app/results";

const BRIEF: Run = {
  id: "demo-brief",
  loop: "brief",
  input: { watchlistTokens: ["AERO", "WETH", "USDC"] },
  sourcesOk: 5,
  sourcesTotal: 5,
  confidence: "high",
  createdAt: "2026-06-30T12:00:00.000Z",
  markdown: `# Daily Brief — AERO · WETH · USDC

## Smart money
- **AlphaTrack**: 3 smart-money wallets accumulated **AERO** in the last 24h, net +$420K.
- Rotation out of stablecoins into majors continues.

## Prices & liquidity
- **SwapCat**: AERO **$1.24** (+6.3%), pool liquidity **$8.2M** on Aerodrome.
- WETH **$3,180**, USDC peg stable.

## Events
- **Polymind**: the Aerodrome gauge vote is live — emissions likely to favor the AERO/USDC pool.

## Market mood
- **DCA Signal**: sentiment reads **greed (71/100)** — momentum-positive but late-cycle.

## Whale positions
- **WhaleScope**: 2 tracked whales opened fresh longs on AERO.

### Takeaway
Smart money and whales are leaning long into rising liquidity while mood runs hot. **Accumulate** with a plan to trim if the gauge vote disappoints.`,
};

const VET: Run = {
  id: "demo-vet",
  loop: "vet",
  input: { token: "GROK9" },
  sourcesOk: 3,
  sourcesTotal: 3,
  verdict: "caution",
  confidence: "medium",
  createdAt: "2026-06-30T12:00:00.000Z",
  markdown: `# Token Verdict — GROK9

**Verdict: Caution**

## Wallet & deployer risk
- **Web3 Risk**: deployer wallet is clean, no links to known drainers. No honeypot signature detected.

## Contract audit
- **ChainGuard**: source verified, no mint or blacklist functions, ownership renounced.

## Liquidity & taxes
- **SwapCat**: liquidity **$1.2M**, but a **3% transfer tax** applies on every trade.

### Takeaway
No hard red flags, but the **3% tax** and thin liquidity for the market cap warrant caution. Size small and use tight slippage.`,
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
  order: {
    principal_amount: 25,
    token_out: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
    recipient: "0x86410d8c1b9b0a3a0b0e0c0d0e0f000000000000",
    slippage_bps: 100,
  },
};

type Tab = "brief" | "vet" | "execute";

export default function DemoRun() {
  const [tab, setTab] = useState<Tab>("brief");

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
          <div className="flex justify-center">
            <Pill>Sandbox</Pill>
          </div>
          <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight">See a result, no spend</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-neutral-400">
            Sample Brief, Vet, and Execute results rendered with the exact production UI — nothing is charged and nothing is placed on-chain.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
              {(["brief", "vet", "execute"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t ? "bg-brand text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  {t === "brief" ? "Daily Brief" : t === "vet" ? "Vet Token" : "Execute"}
                </button>
              ))}
            </div>
          </div>

          <Panel className="mt-6 p-5 sm:p-6">
            {tab === "brief" ? <RunView run={BRIEF} /> : tab === "vet" ? <RunView run={VET} /> : <ExecView prepared={SWAP} />}
          </Panel>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Ready for the real thing?{" "}
            <Link href="/app" className="text-brand hover:underline">
              Open the app →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
