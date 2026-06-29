import Link from "next/link";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";

export function Header() {
  return (
    <header className="border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/capo.png" alt="Capo" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold tracking-tight">Capo</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/briefs" className="text-neutral-300 transition hover:text-white">
            Briefs
          </Link>
          <a
            href={STORE}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Open on CROO
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-x-6 gap-y-2 px-5 py-8 text-xs text-neutral-500">
        <span>Capo — an on-chain crypto copilot on CROO. Built on CAP · Base mainnet · USDC.</span>
        <a href="https://github.com/wildanrhmn/capo" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
          GitHub
        </a>
      </div>
    </footer>
  );
}
