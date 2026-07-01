"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, Label, gradientBtn } from "@/components/ui";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";

export function Redeem({ invalid }: { invalid?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(invalid ? "That code is no longer valid — redeem another." : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.error ?? "Invalid code");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Could not reach Capo. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="flex justify-center">
        <Label>Redeem a Capo Pass</Label>
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight">Enter your code</h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-neutral-400">
        Bought a Capo Pass on CROO? Paste the code you received to load your credits and start asking.
      </p>
      <Panel className="mt-7 p-6">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CAPO-XXXXXXXX-XXXXXXXX"
            spellCheck={false}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm tracking-wide outline-none placeholder:text-neutral-600 focus:border-accent/50"
          />
          {err ? <p className="text-xs text-red-400">{err}</p> : null}
          <button type="submit" disabled={busy} className={`${gradientBtn} px-5 py-3`}>
            {busy ? "Checking…" : "Redeem code"}
          </button>
        </form>
      </Panel>
      <p className="mt-5 text-center text-sm text-neutral-500">
        No code yet?{" "}
        <a href={STORE} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          Get a Pass on CROO →
        </a>
      </p>
    </div>
  );
}
