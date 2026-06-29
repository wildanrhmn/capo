import "dotenv/config";
import { AgentClient } from "@croo-network/sdk";

const silent = { info() {}, warn() {}, error() {}, debug() {} };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const serviceId = process.argv[2];
const requirements = process.argv[3] ?? "";
if (!serviceId) {
  console.error("usage: tsx scripts/hireTest.ts <serviceId> [requirements]");
  process.exit(1);
}

const client = new AgentClient(
  {
    baseURL: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsURL: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    rpcURL: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    logger: silent,
  },
  process.env.CROO_SDK_KEY ?? "",
);

const neg = await client.negotiateOrder({ serviceId, requirements });
console.log(`negotiation: ${neg.negotiationId}`);

let orderId = "";
for (let i = 0; i < 20; i++) {
  const orders = await client.listOrders({ role: "buyer", pageSize: 50 });
  const match = orders.find((o) => o.negotiationId === neg.negotiationId);
  if (match) {
    orderId = match.orderId;
    console.log(`order: ${orderId} (status ${match.status})`);
    break;
  }
  await sleep(3000);
}
if (!orderId) {
  console.log("RESULT: provider never accepted / no order created (stuck at negotiation)");
  process.exit(0);
}

let paid = false;
let last = "";
for (let i = 0; i < 60; i++) {
  const o = await client.getOrder(orderId);
  if (o.status !== last) {
    console.log(`status: ${o.status}`);
    last = o.status;
  }
  if (o.status === "created" && !paid) {
    console.log("paying...");
    try {
      const r = await client.payOrder(orderId);
      console.log(`pay submitted: ${r.txHash}`);
    } catch (e) {
      console.log(`pay error: ${(e as Error).message}`);
    }
    paid = true;
  }
  if (o.status === "completed") {
    const d = await client.getDelivery(orderId);
    const body = (d.deliverableText || d.deliverableSchema || "").slice(0, 600);
    console.log(`RESULT: COMPLETED. delivery (${d.deliverableType}):\n${body}`);
    process.exit(0);
  }
  if (["rejected", "expired", "pay_failed", "create_failed", "deliver_failed"].includes(o.status)) {
    console.log(`RESULT: terminal status ${o.status}`);
    process.exit(0);
  }
  await sleep(3000);
}
console.log(`RESULT: did not complete in ~3min; last status "${last}" (consistent with CROO-side on-chain stall)`);
process.exit(0);
