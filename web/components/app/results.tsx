"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type Loop = "brief" | "vet";

export interface Run {
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

export interface Prepared {
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

export function RunView({ run }: { run: Run }) {
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

export function ExecView({ prepared }: { prepared: Prepared }) {
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
