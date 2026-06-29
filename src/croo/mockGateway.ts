import type { CrooGateway, CrooEvent, EventHandler, NegotiateInput, DeliveryResult } from "./gateway";
import { CrooEventType } from "./gateway";

let seq = 0;
const mkId = (prefix: string): string => `${prefix}_${(++seq).toString(36)}`;

export interface MockOptions {
  failRoles?: string[];
  latencyMs?: number;
  dropRoles?: string[];
}

interface MockOrder {
  orderId: string;
  negotiationId: string;
  serviceId: string;
  status: string;
}

export function createMockGateway(
  deliverables: Record<string, DeliveryResult>,
  roleByService: Record<string, string>,
  opts: MockOptions = {},
): CrooGateway {
  const handlers = new Set<EventHandler>();
  const emit = (e: CrooEvent): void => handlers.forEach((h) => h(e));
  const negStore = new Map<string, { serviceId: string; requirements: string }>();
  const orders = new Map<string, MockOrder>();
  const latency = opts.latencyMs ?? 150;
  const fail = new Set(opts.failRoles ?? []);
  const drop = new Set(opts.dropRoles ?? []);

  return {
    async negotiate(input: NegotiateInput) {
      const negotiationId = mkId("neg");
      negStore.set(negotiationId, { serviceId: input.serviceId, requirements: input.requirements });
      const role = roleByService[input.serviceId];
      setTimeout(() => {
        if (role && drop.has(role)) return;
        if (role && fail.has(role)) {
          emit({ type: CrooEventType.NegotiationRejected, negotiationId });
          return;
        }
        const orderId = mkId("ord");
        orders.set(orderId, { orderId, negotiationId, serviceId: input.serviceId, status: "created" });
      }, latency);
      return { negotiationId };
    },

    async pay(orderId: string) {
      const o = orders.get(orderId);
      setTimeout(() => {
        if (o) o.status = "completed";
      }, 50);
      return { txHash: mkId("0xtx") };
    },

    async getDelivery(orderId: string): Promise<DeliveryResult> {
      const o = orders.get(orderId);
      const role = o ? roleByService[o.serviceId] : undefined;
      if (role && deliverables[role]) return deliverables[role];
      return { deliverableType: "text", deliverableText: `mock result (${role ?? "unknown"})` };
    },

    async getOrder(orderId: string) {
      const o = orders.get(orderId);
      return { negotiationId: o?.negotiationId ?? "", serviceId: o?.serviceId ?? "", status: o?.status ?? "created" };
    },

    async getNegotiation(negotiationId: string) {
      return negStore.get(negotiationId) ?? { serviceId: "", requirements: "" };
    },

    async listOrders() {
      return [...orders.values()].map((o) => ({ orderId: o.orderId, serviceId: o.serviceId, status: o.status, negotiationId: o.negotiationId }));
    },

    async acceptNegotiation() {
      return { orderId: mkId("ord") };
    },

    async deliver() {
      return;
    },

    on(handler: EventHandler) {
      handlers.add(handler);
    },
    off(handler: EventHandler) {
      handlers.delete(handler);
    },
    async start() {
      return;
    },
    async stop() {
      return;
    },
  };
}
