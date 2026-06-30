import Link from "next/link";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";

export function Header() {
  return (
    <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2">
      <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-[#0c0e12]/80 pl-4 pr-2 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/capo.svg" alt="Capo" width={26} height={26} className="rounded-lg" />
          <span className="font-semibold tracking-tight">Capo</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/app" className="rounded-full px-3.5 py-2 text-neutral-300 transition hover:text-white">
            App
          </Link>
          <a href={STORE} target="_blank" rel="noreferrer" className="btn-brand px-4 py-2 text-sm">
            Get a Pass
          </a>
        </nav>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-x-6 gap-y-2 px-6 py-8 text-xs text-neutral-500">
        <span>Capo — an on-chain crypto copilot on CROO. Built on CAP · Base mainnet · USDC.</span>
        <a href="https://github.com/wildanrhmn/capo" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
          GitHub
        </a>
      </div>
    </footer>
  );
}
