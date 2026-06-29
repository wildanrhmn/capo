import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { recentBriefs } from "@/lib/briefs";
import { Header, Footer } from "@/components/site";

export const dynamic = "force-dynamic";

const STORE = process.env.NEXT_PUBLIC_CAPO_STORE_URL ?? "https://agent.croo.network";

export default async function Briefs() {
  const briefs = await recentBriefs(6);
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Live briefs</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Real briefs Capo has delivered on-chain, each synthesized from its specialist sub-agents.
        </p>

        {briefs.length === 0 ? (
          <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-neutral-500">
            No briefs yet.{" "}
            <a href={STORE} target="_blank" rel="noreferrer" className="text-teal-300 underline">
              Order one on CROO
            </a>{" "}
            and it&apos;ll appear here.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {briefs.map((b) => (
              <article key={b.orderId} className="min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-mono">#{b.orderId.slice(0, 8)}</span>
                  <span>{b.deliveredAt ? new Date(b.deliveredAt).toLocaleString() : ""}</span>
                </div>
                <div className="brief">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.markdown}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
