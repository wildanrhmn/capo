import "dotenv/config";
import { AgentClient } from "@croo-network/sdk";

const id = process.argv[2];
if (!id) {
  console.error("usage: tsx scripts/order.ts <orderId>");
  process.exit(1);
}

const client = new AgentClient(
  {
    baseURL: process.env.CROO_API_URL ?? "https://api.croo.network",
    wsURL: process.env.CROO_WS_URL ?? "wss://api.croo.network/ws",
    rpcURL: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
  },
  process.env.CROO_SDK_KEY ?? "",
);

const o = await client.getOrder(id);
console.log(
  JSON.stringify(
    {
      status: o.status,
      price: o.price,
      serviceId: o.serviceId,
      requesterAgentId: o.requesterAgentId,
      providerAgentId: o.providerAgentId,
      buyerUserId: o.buyerUserId,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      payTxHash: o.payTxHash,
      payDeadline: o.payDeadline,
      slaDeadline: o.slaDeadline,
    },
    null,
    2,
  ),
);
process.exit(0);
