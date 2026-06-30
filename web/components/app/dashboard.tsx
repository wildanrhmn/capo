"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Panel } from "@/components/ui";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";
const PRESETS = ["USDC", "WETH", "AERO", "cbBTC", "DEGEN"];

type Loop = "brief" | "vet";

interface Run {
  id: string;
  loop: Loop;
  input: unknown;
  markdown: string;
  sourcesOk: number;
  sourcesTotal: number;
  verdict?: string;
  confidence: string;
  createdAt: string;
}

interface Prepared {
  ok: boolean;
  tokenSymbol: string;
  tokenOut: string;
  tokenVerified: boolean;
  recipient: string;
  principalAmount: number;
  slippageBps: number;
  storeUrl: string;
  order: Record<string, unknown>;
}

type Tab = "brief" | "vet" | "execute";
type Result = { kind: "run"; run: Run } | { kind: "exec"; prepared: Prepared } | null;

export function Dashboard({ initialRemaining, initialRuns }: { code: string; initialRemaining: number; initialRuns: Run[] }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(initialRemaining);
  const [runs, setRuns] = useState<Run[]>(initialRuns ?? []);
  const [tab, setTab] = useState<Tab>("brief");
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [tokens, setTokens] = useState("AERO, WETH, USDC");
  const [wallets, setWallets] = useState("");
  const [vetToken, setVetToken] = useState("");
  const [exToken, setExToken] = useState("AERO");
  const [exAmount, setExAmount] = useState("25");
  const [exRecipient, setExRecipient] = useState("");
  const [exSlippage, setExSlippage] = useState("1");

  const noCredits = remaining <= 0;

  async function runLoop(loop: Loop, input: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ loop, input }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "Run failed");
        return;
      }
      setRemaining(d.remaining);
      setRuns((prev) => [d.run, ...prev]);
      setResult({ kind: "run", run: d.run });
    } catch {
      setError("Could not reach Capo. Is the agent running?");
    } finally {
      setBusy(false);
    }
  }

  async function prepareExecute() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: exToken,
          amountUsd: Number(exAmount),
          recipient: exRecipient,
          slippageBps: Math.round(Number(exSlippage) * 100),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setError(d.error ?? "Could not prepare the swap");
        return;
      }
      setResult({ kind: "exec", prepared: d });
    } catch {
      setError("Could not reach Capo. Is the agent running?");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Your workspace</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">What do you want to know?</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand/30 bg-brand/[0.07] px-3 py-1.5 font-mono text-xs text-brand">
            {remaining} credit{remaining === 1 ? "" : "s"}
          </span>
          <button onClick={logout} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-400 transition hover:text-white">
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
        {(["brief", "vet", "execute"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError("");
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? "bg-brand text-neutral-950" : "text-neutral-400 hover:text-white"
            }`}
          >
            {t === "brief" ? "Daily Brief" : t === "vet" ? "Vet Token" : "Execute"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Form */}
        <Panel className="p-5">
          {tab === "brief" && (
            <Form
              title="Daily Brief"
              hint="Smart money, prices, events, and mood across your watchlist — one synthesized brief."
              cost="1 credit"
              disabled={busy || noCredits}
              cta="Get brief"
              onSubmit={() => runLoop("brief", { tokens, wallets })}
            >
              <Field label="Watchlist tokens" sub="Comma-separated symbols">
                <input value={tokens} onChange={(e) => setTokens(e.target.value)} placeholder="AERO, WETH, USDC" className={inputCls} />
              </Field>
              <Field label="Whale wallets" sub="Optional — adds live whale positions">
                <input value={wallets} onChange={(e) => setWallets(e.target.value)} placeholder="0xabc…, 0xdef…" className={inputCls} />
              </Field>
            </Form>
          )}

          {tab === "vet" && (
            <Form
              title="Vet a Token"
              hint="Wallet risk, contract audit, and liquidity weighed into a safe / caution / scam verdict."
              cost="1 credit"
              disabled={busy || noCredits}
              cta="Vet token"
              onSubmit={() => runLoop("vet", { token: vetToken })}
            >
              <Field label="Token" sub="Symbol or 0x contract address">
                <input value={vetToken} onChange={(e) => setVetToken(e.target.value)} placeholder="0x… or AERO" className={inputCls} />
              </Field>
            </Form>
          )}

          {tab === "execute" && (
            <Form
              title="Execute a Swap"
              hint="Capo prepares the trade. You place it through SwapGod — your USDC, to your wallet, never held by Capo."
              cost="your wallet"
              disabled={busy}
              cta="Prepare swap"
              onSubmit={prepareExecute}
            >
              <Field label="Buy token" sub="Listed symbol or 0x address">
                <input value={exToken} onChange={(e) => setExToken(e.target.value)} placeholder="AERO" className={inputCls} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => setExToken(p)} className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[11px] text-neutral-400 transition hover:border-brand/40 hover:text-brand">
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (USDC)">
                  <input value={exAmount} onChange={(e) => setExAmount(e.target.value)} inputMode="decimal" className={inputCls} />
                </Field>
                <Field label="Slippage %">
                  <input value={exSlippage} onChange={(e) => setExSlippage(e.target.value)} inputMode="decimal" className={inputCls} />
                </Field>
              </div>
              <Field label="Recipient wallet" sub="Where the token lands — your address">
                <input value={exRecipient} onChange={(e) => setExRecipient(e.target.value)} placeholder="0x…" className={`${inputCls} font-mono`} />
              </Field>
            </Form>
          )}

          {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
          {noCredits && tab !== "execute" ? (
            <p className="mt-3 text-xs text-neutral-500">
              Out of credits.{" "}
              <a href={STORE} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                Get another Pass →
              </a>
            </p>
          ) : null}
        </Panel>

        {/* Result */}
        <Panel className="p-5">
          {busy ? (
            <Pending tab={tab} />
          ) : result?.kind === "run" ? (
            <RunView run={result.run} />
          ) : result?.kind === "exec" ? (
            <ExecView prepared={result.prepared} />
          ) : (
            <Placeholder tab={tab} />
          )}
        </Panel>
      </div>

      {/* History */}
      {runs.length > 0 && (
        <div className="mt-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Your history</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setResult({ kind: "run", run })}
                className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3 text-left transition hover:border-white/15"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize text-neutral-200">{run.loop === "brief" ? "Daily Brief" : "Vet"}</span>
                  <span className="font-mono text-[10px] text-neutral-600">{new Date(run.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 truncate text-[11px] text-neutral-500">
                  {run.sourcesOk}/{run.sourcesTotal} sources · {run.confidence} confidence
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-neutral-600 focus:border-brand/50";

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-200">{label}</span>
        {sub ? <span className="text-[11px] text-neutral-500">{sub}</span> : null}
      </div>
      {children}
    </label>
  );
}

function Form({
  title,
  hint,
  cost,
  cta,
  disabled,
  onSubmit,
  children,
}: {
  title: string;
  hint: string;
  cost: string;
  cta: string;
  disabled: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-neutral-500">{cost}</span>
      </div>
      <p className="-mt-2 text-xs leading-relaxed text-neutral-500">{hint}</p>
      {children}
      <button type="submit" disabled={disabled} className="btn-brand px-5 py-2.5 disabled:opacity-50">
        {cta}
      </button>
    </form>
  );
}

function Placeholder({ tab }: { tab: Tab }) {
  const msg =
    tab === "execute" ? "Your prepared swap will appear here, ready to place on CROO." : "Your brief will appear here, with every source attributed.";
  return <div className="flex h-full min-h-[16rem] items-center justify-center px-6 text-center text-sm text-neutral-600">{msg}</div>;
}

function Pending({ tab }: { tab: Tab }) {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
      <p className="text-sm text-neutral-400">
        {tab === "execute" ? "Preparing your swap…" : "Capo is hiring the crew and synthesizing…"}
      </p>
    </div>
  );
}

function RunView({ run }: { run: Run }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="text-xs font-medium capitalize text-neutral-300">{run.loop === "brief" ? "Daily Brief" : "Token Verdict"}</span>
        <span className="font-mono text-[11px] text-neutral-500">
          {run.sourcesOk}/{run.sourcesTotal} sources · {run.confidence}
        </span>
      </div>
      <div className="brief mt-4 max-h-[28rem] overflow-y-auto overflow-x-hidden pr-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.markdown}</ReactMarkdown>
      </div>
    </div>
  );
}

function ExecView({ prepared }: { prepared: Prepared }) {
  const copy = () => navigator.clipboard?.writeText(JSON.stringify(prepared.order, null, 2));
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="text-xs font-medium text-neutral-300">Ready to swap</span>
        <span className="font-mono text-[11px] text-neutral-500">via SwapGod</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] py-4">
        <span className="font-mono text-sm text-neutral-300">{prepared.principalAmount} USDC</span>
        <span className="text-brand">→</span>
        <span className="font-mono text-sm font-semibold text-white">{prepared.tokenSymbol}</span>
      </div>

      <dl className="mt-3 space-y-2 text-xs">
        <Row k="Token address" v={prepared.tokenOut} mono />
        <Row k="Recipient" v={prepared.recipient} mono />
        <Row k="Slippage" v={`${(prepared.slippageBps / 100).toFixed(2)}%`} />
      </dl>

      {!prepared.tokenVerified ? (
        <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.05] px-3 py-2 text-[11px] leading-relaxed text-yellow-300/90">
          Unlisted token — confirm this address on Basescan before you pay.
        </p>
      ) : null}

      <a href={prepared.storeUrl} target="_blank" rel="noreferrer" className="btn-brand mt-4 w-full px-5 py-3">
        Place order on SwapGod →
      </a>
      <button onClick={copy} className="mt-2 w-full rounded-full border border-white/10 px-5 py-2.5 text-xs text-neutral-400 transition hover:text-white">
        Copy parameters
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
        You pay the USDC on CROO and SwapGod swaps it on Aerodrome, sending {prepared.tokenSymbol} to your wallet. Capo never holds your funds.
      </p>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-500">{k}</dt>
      <dd className={`truncate text-neutral-300 ${mono ? "font-mono text-[11px]" : ""}`} title={v}>
        {v}
      </dd>
    </div>
  );
}
