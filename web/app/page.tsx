import { getCapoStats, ROSTER } from "@/lib/croo";
import { Header, Footer } from "@/components/site";
import { Panel, SectionHead, Pill } from "@/components/ui";
import { Hero } from "@/components/hero";
import { FlowDemo } from "@/components/flow-demo";
import { Reveal, RevealStagger, RevealItem } from "@/components/reveal";
import Link from "next/link";

export const revalidate = 30;

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";
const usd = (base: string) => `$${(Number(base) / 1e6).toFixed(2)}`;

const STEPS = [
  { n: "01", title: "Get a Pass", body: "Buy a Capo Pass on the CROO store. You receive a code loaded with credits — no subscription, no wallet to connect." },
  { n: "02", title: "Ask once", body: "Redeem the code here, save a watchlist of tokens, or drop a single token to vet. One question is all it takes." },
  { n: "03", title: "Capo hires the crew", body: "It fans out to four or five specialist agents on the store and pays each in USDC, per call, on Base mainnet." },
  { n: "04", title: "Read one brief", body: "Capo synthesizes every reply into a single attributed brief — or a safe / caution / scam verdict — saved to your history." },
];

const CAPS = [
  { kicker: "Know", tone: "text-brand", tag: "1 credit", label: "Daily Brief", body: "A read on your watchlist — smart-money moves, prices, trending events, and market mood, synthesized into one brief with its sources." },
  { kicker: "Judge", tone: "text-accent", tag: "1 credit", label: "Vet a Token", body: "Drop a contract address and get a safe / caution / scam verdict — wallet risk, contract audit, and liquidity, weighed in one call." },
  { kicker: "Act", tone: "text-brand", tag: "your wallet", label: "Execute a Swap", body: "Like the call? Capo prepares the trade and you place it through SwapGod on Base — your funds, to your wallet, never held by Capo." },
];

export default async function Home() {
  const stats = await getCapoStats();
  const isOnline = stats?.online === "online";
  const crew = ROSTER.slice(0, 7).map((a) => a.name);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero crew={crew} />

        {/* Live stats banner — Progena style */}
        {stats && (
          <section className="relative z-10 border-y border-white/10 bg-[#0a0b0d]">
            <div className="mx-auto grid max-w-6xl grid-cols-2 xl:grid-cols-4">
              <BannerStat label="Orders filled" value={String(stats.completedOrders)} index={0} />
              <BannerStat label="USDC volume" value={usd(stats.totalVolume)} index={1} />
              <BannerStat label="Completion" value={`${Math.round(Number(stats.completionRate))}%`} index={2} />
              <BannerStat label="Status" value={isOnline ? "Online" : "Offline"} accent={isOnline} index={3} last />
            </div>
          </section>
        )}

        {/* Capabilities */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <SectionHead
                eyebrow="What Capo does"
                title="Know it. Judge it. Act on it."
                lead="Three jobs, one copilot — each a real flow that pays specialist agents on CROO and settles on Base."
              />
            </Reveal>
            <RevealStagger className="grid gap-3 md:grid-cols-3">
              {CAPS.map((c) => (
                <RevealItem key={c.label}>
                  <Panel className="flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium uppercase tracking-[0.18em] ${c.tone}`}>{c.kicker}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-neutral-500">{c.tag}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-medium">{c.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{c.body}</p>
                  </Panel>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* Animated example flow */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <SectionHead
                eyebrow="A run, start to finish"
                title="One question in. One brief out."
                lead="This is the shape of a real run. Capo dispatches the crew, pays each agent on-chain as it answers, then synthesizes everything into a single verdict."
              />
            </Reveal>
            <Reveal delay={0.05}>
              <FlowDemo />
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <SectionHead
                eyebrow="How it works"
                title="One Pass. One question. One brief."
                lead="No dashboards to wire up and no tools to subscribe to. You buy a Pass, ask, and Capo does the legwork on-chain."
              />
            </Reveal>
            <RevealStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <RevealItem key={s.n}>
                  <Panel className="group h-full p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-brand">{s.n}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand/40 transition group-hover:bg-brand" />
                    </div>
                    <h3 className="mt-6 font-medium">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.body}</p>
                  </Panel>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>

        {/* The crew */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <SectionHead
                eyebrow="The crew"
                title="A crew, not a chatbot."
                lead="Each agent does one thing well. Capo splits the work, pays them per call, and synthesizes the replies — so you get judgement, not eight raw feeds."
              />
            </Reveal>
            <RevealStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {ROSTER.map((a) => (
                <RevealItem key={a.name}>
                  <Panel className="h-full p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{a.name}</div>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-neutral-600">{a.loop}</span>
                    </div>
                    <div className="mt-1.5 text-xs leading-relaxed text-neutral-500">{a.role}</div>
                  </Panel>
                </RevealItem>
              ))}
            </RevealStagger>
            <Reveal>
              <p className="mt-6 max-w-2xl text-xs leading-relaxed text-neutral-600">
                Every run pays these agents real USDC on Base — composable, verifiable agent-to-agent commerce. The website
                triggers the same engine; nothing settles off CROO.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative overflow-hidden border-t border-white/5">
          <div className="pointer-events-none absolute left-1/2 top-4 h-[20rem] w-[44rem] -translate-x-1/2 rounded-full bg-brand/[0.08] blur-[150px]" />
          <Reveal className="relative mx-auto max-w-3xl px-6 py-28 text-center">
            <div className="flex justify-center">
              <Pill>Put a copilot on it</Pill>
            </div>
            <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Stop juggling tabs. <span className="font-display italic text-brand">Ask Capo.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-pretty text-neutral-400">
              Grab a Pass, redeem the code, and get your first synthesized brief in about two minutes.
            </p>
            <div className="mt-9 flex justify-center">
              <a href={STORE} target="_blank" rel="noreferrer" className="btn-brand px-7 py-3.5">
                Get a Pass on CROO
              </a>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

function BannerStat({ label, value, accent, index, last }: { label: string; value: string; accent?: boolean; index: number; last?: boolean }) {
  const borders = [
    !last ? "xl:border-r border-white/10" : "",
    index < 2 ? "sm:border-b xl:border-b-0 border-white/10" : "",
    index % 2 === 0 ? "border-r xl:border-r border-white/10" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Reveal delay={index * 0.06} className={`px-6 py-12 text-center sm:py-16 ${borders}`}>
      <p className={`font-display text-5xl leading-none tracking-tight sm:text-6xl ${accent ? "text-accent" : "text-white"}`}>{value}</p>
      <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-neutral-500">{label}</p>
    </Reveal>
  );
}
