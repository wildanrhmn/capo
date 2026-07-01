"use client";

import Link from "next/link";
import { gradientBtn } from "./ui";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#030305]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/capo.svg" alt="Capo" width={24} height={24} className="rounded-lg" />
          <span className="font-semibold tracking-tight text-white">Capo</span>
        </Link>
        <nav className="flex items-center gap-2 text-[13px]">
          <Link href="/app" className="rounded-full px-3 py-2 font-medium text-white/50 transition-colors hover:text-white">
            App
          </Link>
          <Link href="/demo/run" className="rounded-full px-3 py-2 font-medium text-white/50 transition-colors hover:text-white">
            Demo
          </Link>
          <a href={STORE} target="_blank" rel="noreferrer" className={`${gradientBtn} px-4 py-2 text-[13px]`}>
            Get a Pass
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.05]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-[13px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
        <span>Capo — an on-chain crypto copilot on CROO. Built on CAP, Base mainnet, USDC.</span>
        <a href="https://github.com/wildanrhmn/capo" target="_blank" rel="noreferrer" className="transition-colors hover:text-white/60">
          GitHub
        </a>
      </div>
    </footer>
  );
}
