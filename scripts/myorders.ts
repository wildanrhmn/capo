import "dotenv/config";
import { AgentClient } from "@croo-network/sdk";

const silent = { info() {}, warn() {}, error() {}, debug() {} };
const client = new AgentClient(
  {
    baseURL: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsURL: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    rpcURL: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    logger: silent,
  },
  process.env.CROO_SDK_KEY ?? "",
);

const role = process.argv[2] ?? "buyer";
const orders = await client.listOrders({ role, pageSize: 12 });
for (const o of orders.slice(0, 12)) {
  console.log(`${o.status.padEnd(11)} ${o.orderId}  svc=${o.serviceId.slice(0, 8)} created=${o.createdTime ?? o.createdAt ?? ""} delivered=${o.deliveredAt ?? ""}`);
}
process.exit(0);
