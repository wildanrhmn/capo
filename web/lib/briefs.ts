import "server-only";
import { AgentClient } from "@croo-network/sdk";

const silent = { info() {}, warn() {}, error() {}, debug() {} };

export interface BriefItem {
  orderId: string;
  deliveredAt: string;
  markdown: string;
}

function client(): AgentClient | null {
  const key = process.env.CROO_SDK_KEY;
  if (!key) return null;
  return new AgentClient(
    {
      baseURL: process.env.CROO_API_URL ?? "https://api.croo.network",
      rpcURL: "https://mainnet.base.org",
      logger: silent,
    },
    key,
  );
}

export async function recentBriefs(limit = 6): Promise<BriefItem[]> {
  const c = client();
  if (!c) return [];
  const briefService = process.env.CAPO_SERVICE_BRIEF;
  try {
    const orders = await c.listOrders({ role: "provider", status: "completed", pageSize: 40 });
    const briefOrders = orders.filter((o) => !briefService || o.serviceId === briefService).slice(0, limit);
    const items: BriefItem[] = [];
    for (const o of briefOrders) {
      try {
        const d = await c.getDelivery(o.orderId);
        const md = d.deliverableText || d.deliverableSchema || "";
        if (md.trim()) items.push({ orderId: o.orderId, deliveredAt: o.deliveredAt ?? o.updatedTime ?? "", markdown: md });
      } catch {
        /* skip */
      }
    }
    return items;
  } catch {
    return [];
  }
}
