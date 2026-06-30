import { cookies } from "next/headers";
import { capoFetch } from "@/lib/api";
import { Header, Footer } from "@/components/site";
import { Redeem } from "@/components/app/redeem";
import { Dashboard } from "@/components/app/dashboard";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const jar = await cookies();
  const code = jar.get("capo_code")?.value;

  let initial: { remaining: number; runs: [] } | null = null;
  if (code) {
    try {
      const r = await capoFetch(`/history?code=${encodeURIComponent(code)}`);
      if (r.ok) initial = await r.json();
    } catch {
      initial = null;
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
          {code && initial ? (
            <Dashboard code={code} initialRemaining={initial.remaining} initialRuns={initial.runs} />
          ) : (
            <Redeem invalid={Boolean(code) && !initial} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
