import "dotenv/config";
import { createRealGateway } from "./croo/realGateway";
import { resolveRoster } from "./roster";
import { setupProvider } from "./provider";
import { PayQueue } from "./engine/payQueue";
import { parseInput } from "./inputs";
import { CreditStore } from "./credits/store";
import { startApi } from "./api";
import type { LoopName } from "./synth/synthesize";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

const gateway = createRealGateway(
  {
    baseURL: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsURL: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    rpcURL: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
  },
  required("CROO_SDK_KEY"),
);

const capoAgentId = required("CAPO_AGENT_ID");
const serviceLoops: Record<string, LoopName> = {};
if (process.env.CAPO_SERVICE_BRIEF) serviceLoops[process.env.CAPO_SERVICE_BRIEF] = "brief";
if (process.env.CAPO_SERVICE_VET) serviceLoops[process.env.CAPO_SERVICE_VET] = "vet";

const passServiceId = process.env.CAPO_SERVICE_PASS;
const creditsPerPass = Number(process.env.CAPO_CREDITS_PER_PASS ?? 10);
const siteUrl = process.env.CAPO_SITE_URL ?? "http://localhost:3000";
const store = new CreditStore(process.env.CAPO_CREDITS_DB ?? "data/credits.json");

const resolution = await resolveRoster();
const online = resolution.resolved.filter((r) => r.online).length;
if (resolution.problems.length > 0) for (const p of resolution.problems) console.warn("[roster]", p);

const payQueue = new PayQueue();
const log = (m: string) => console.log("[capo]", m);

const provider = setupProvider(gateway, {
  capoAgentId,
  serviceLoops,
  resolution,
  payQueue,
  parseInput,
  passServiceId,
  onPass: async () => {
    const rec = store.issue(creditsPerPass);
    return `Your Capo Pass is ready.\n\nCode: ${rec.code}\nCredits: ${rec.credits}\n\nRedeem at ${siteUrl}/app and spend your credits on daily briefs and token verdicts.`;
  },
  log,
});

await gateway.start();
console.log(`[capo] live · agent=${capoAgentId} · services=${JSON.stringify(serviceLoops)}${passServiceId ? " +pass" : ""} · roster=${online} online`);
await provider.fulfillPaidBacklog();

startApi({
  gateway,
  resolution,
  payQueue,
  store,
  port: Number(process.env.CAPO_API_PORT ?? 8790),
  secret: process.env.CAPO_API_SECRET,
  siteOrigin: process.env.CAPO_SITE_ORIGIN,
  storeBase: process.env.CAPO_STORE_URL ?? "https://agent.croo.network",
  log,
});

process.on("SIGINT", () => {
  void gateway.stop();
  process.exit(0);
});
