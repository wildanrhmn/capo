import "dotenv/config";
import { createRealGateway } from "./croo/realGateway";
import { resolveRoster } from "./roster";
import { setupProvider } from "./provider";
import { PayQueue } from "./engine/payQueue";
import type { JobInput, BriefInput, VetInput } from "./engine/requirements";
import type { LoopName } from "./synth/synthesize";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function parseInput(loop: LoopName, requirements: string): JobInput {
  let raw: Record<string, unknown> = {};
  try {
    raw = requirements ? (JSON.parse(requirements) as Record<string, unknown>) : {};
  } catch {
    raw = {};
  }
  if (loop === "vet") {
    const vet: VetInput = {
      token: String(raw.token ?? raw.address ?? raw.target ?? ""),
      chain: String(raw.chain ?? "base"),
    };
    return vet;
  }
  const tokens = Array.isArray(raw.watchlistTokens)
    ? raw.watchlistTokens.map(String)
    : typeof raw.tokens === "string"
      ? raw.tokens.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  const wallets = Array.isArray(raw.watchlistWallets)
    ? raw.watchlistWallets.map(String)
    : typeof raw.wallets === "string"
      ? raw.wallets.split(",").map((w) => w.trim()).filter(Boolean)
      : [];
  const brief: BriefInput = { watchlistTokens: tokens, watchlistWallets: wallets, chain: String(raw.chain ?? "base") };
  return brief;
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

const resolution = await resolveRoster();
const online = resolution.resolved.filter((r) => r.online).length;
if (resolution.problems.length > 0) for (const p of resolution.problems) console.warn("[roster]", p);

const payQueue = new PayQueue();
const provider = setupProvider(gateway, { capoAgentId, serviceLoops, resolution, payQueue, parseInput, log: (m) => console.log("[capo]", m) });

await gateway.start();
console.log(`[capo] live · agent=${capoAgentId} · services=${JSON.stringify(serviceLoops)} · roster=${online} online`);
await provider.fulfillPaidBacklog();
process.on("SIGINT", () => {
  void gateway.stop();
  process.exit(0);
});
