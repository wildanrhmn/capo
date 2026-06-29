import Link from "next/link";
import { getCapoStats, ROSTER } from "@/lib/croo";
import { Header, Footer } from "@/components/site";

export const revalidate = 30;

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";
const usd = (base: string) => `$${(Number(base) / 1e6).toFixed(2)}`;

export default async function Home() {
  const stats = await getCapoStats();
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-5 pt-20 pb-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/capo.png"
            width={84}
            height={84}
            alt="Capo"
            className="mx-auto rounded-2xl shadow-[0_0_60px_-10px_rgba(242,166,62,0.5)]"
          />
          <h1 className="mt-7 text-4xl font-semibold tracking-tight sm:text-5xl">Your on-chain crypto copilot</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400 sm:text-lg">
            Capo hires the best specialist agents on the CROO store, pays them in USDC, and returns{" "}
            <span className="text-neutral-200">one synthesized brief</span> — smart money, prices, events, market mood, and
            token verdicts.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href={STORE}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white px-5 py-2.5 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              Get a brief on CROO
            </a>
            <Link
              href="/briefs"
              className="rounded-xl border border-white/10 px-5 py-2.5 font-medium text-neutral-200 transition hover:bg-white/5"
            >
              See live briefs →
            </Link>
          </div>
          {stats && (
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Orders" value={String(stats.completedOrders)} />
              <Stat label="Volume" value={usd(stats.totalVolume)} />
              <Stat label="Completion" value={`${Math.round(Number(stats.completionRate))}%`} />
              <Stat label="Status" value={stats.online === "online" ? "● Online" : "Offline"} accent={stats.online === "online"} />
            </div>
          )}
        </section>

        <section className="border-y border-white/5 bg-white/[0.015]">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">How it works</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Step n="1" title="You ask" body="Pick a watchlist (tokens, optional wallet) or a token to vet, and pay a flat fee in USDC on CROO." />
              <Step n="2" title="Capo hires a crew" body="It fans out to 4–5 specialist agents on the store, paying each per call and collecting their results." />
              <Step n="3" title="One clean answer" body="Capo synthesizes everything into a single attributed brief, or a safe / caution / scam verdict." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500">The crew Capo composes</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROSTER.map((a) => (
              <div key={a.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="mt-1 text-xs text-neutral-500">{a.role}</div>
                <div className="mt-3 inline-block rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                  {a.loop}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-neutral-600">
            Every Capo run pays these agents real USDC on-chain — composable, verifiable agent-to-agent commerce.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className={`text-lg font-semibold ${accent ? "text-teal-300" : "text-white"}`}>{value}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/15 text-sm font-semibold text-amber-400">
        {n}
      </div>
      <div className="mt-3 font-medium">{title}</div>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{body}</p>
    </div>
  );
}
