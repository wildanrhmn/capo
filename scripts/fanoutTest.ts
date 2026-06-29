import "dotenv/config";
import { createRealGateway } from "../src/croo/realGateway";
import { resolveRoster, rosterForLoop } from "../src/roster";
import { buildRequirements } from "../src/engine/requirements";
import type { BriefInput } from "../src/engine/requirements";
import { runFanout } from "../src/engine/orchestrator";
import type { SubTask } from "../src/engine/orchestrator";
import { PayQueue } from "../src/engine/payQueue";

const gateway = createRealGateway(
  {
    baseURL: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsURL: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    rpcURL: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
  },
  process.env.CROO_SDK_KEY ?? "",
);

await gateway.start();
console.log("ws connected; running real fan-out over the brief roster...\n");

const resolution = await resolveRoster();
const entries = rosterForLoop(resolution, "brief");
const input: BriefInput = { watchlistTokens: ["ETH", "AERO"], watchlistWallets: [], chain: "base" };

const tasks: SubTask[] = entries.map((e) => ({
  role: e.role,
  agentName: e.agentName,
  serviceId: e.serviceId,
  price: e.price,
  requirements: buildRequirements(e, input),
}));

const payQueue = new PayQueue();
const results = await runFanout(gateway, tasks, { payQueue, deadlineMs: 180_000, log: (m) => console.log("  ·", m) });

console.log("\n=== results ===");
let spent = 0;
for (const r of results) {
  const body = (r.deliverableText || r.deliverableSchema || "").replace(/\s+/g, " ").slice(0, 90);
  console.log(`${r.status === "completed" ? "OK " : "ERR"} ${r.role.padEnd(15)} ${r.agentName}  ${r.error ?? body}`);
  spent += Number(r.costPaid);
}
const ok = results.filter((r) => r.status === "completed").length;
console.log(`\n${ok}/${results.length} delivered · spent $${(spent / 1e6).toFixed(2)}`);
await gateway.stop();
process.exit(0);
