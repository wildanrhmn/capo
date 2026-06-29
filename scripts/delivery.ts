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

const id = process.argv[2];
const d = await client.getDelivery(id);
console.log(d.deliverableText || d.deliverableSchema || "(empty)");
process.exit(0);
