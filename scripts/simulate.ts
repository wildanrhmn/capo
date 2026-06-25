import "dotenv/config";
import { resolveRoster, rosterForLoop } from "../src/roster";
import type { BriefInput } from "../src/engine/requirements";
import { runLoop } from "../src/loops";
import { PayQueue } from "../src/engine/payQueue";
import { createMockGateway } from "../src/croo/mockGateway";
import type { DeliveryResult } from "../src/croo/gateway";

const usd = (base: string | number): string => `$${(Number(base) / 1e6).toFixed(2)}`;

const resolution = await resolveRoster();
const entries = rosterForLoop(resolution, "brief");

const input: BriefInput = {
  watchlistTokens: ["ETH", "AERO"],
  watchlistWallets: ["0x1111111111111111111111111111111111111111"],
  chain: "base",
};

const roleByService: Record<string, string> = {};
const deliverables: Record<string, DeliveryResult> = {};
for (const e of entries) {
  roleByService[e.serviceId] = e.role;
  deliverables[e.role] = { deliverableType: "text", deliverableText: `[${e.agentName}] sample ${e.role} data` };
}

const gateway = createMockGateway(deliverables, roleByService, { failRoles: ["events"], latencyMs: 120 });
const payQueue = new PayQueue();

console.log(`Running "brief" loop over ${entries.length} agents (mock gateway; "events" forced to fail, sequential pay)...\n`);
const out = await runLoop(gateway, "brief", entries, input, payQueue, { deadlineMs: 8000, log: (m) => console.log("  ·", m) });

console.log("\n--- Fan-out ---");
for (const r of out.results) {
  console.log(`  ${r.status === "completed" ? "OK " : "ERR"} ${r.role.padEnd(15)} ${r.agentName}${r.error ? ` — ${r.error}` : ""}`);
}
console.log(`\nSpent ${usd(out.spent)} · synth model: ${out.synthesis.model} · confidence: ${out.synthesis.confidence}`);
console.log("\n--- Synthesized brief ---\n");
console.log(out.synthesis.markdown);
process.exit(0);
