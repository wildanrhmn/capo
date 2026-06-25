import type { CrooGateway, CrooEvent, EventHandler, NegotiateInput, DeliveryResult } from "./gateway";
import { CrooEventType } from "./gateway";

let seq = 0;
const mkId = (prefix: string): string => `${prefix}_${(++seq).toString(36)}`;

export interface MockOptions {
  failRoles?: string[];
  latencyMs?: number;
  dropRoles?: string[];
}

export function createMockGateway(
  deliverables: Record<string, DeliveryResult>,
  roleByService: Record<string, string>,
  opts: MockOptions = {},
): CrooGateway {
  const handlers = new Set<EventHandler>();
  const emit = (e: CrooEvent): void => handlers.forEach((h) => h(e));
  const orderToService = new Map<string, string>();
  const orderToNeg = new Map<string, string>();
  const negStore = new Map<string, { serviceId: string; requirements: string }>();
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
        orderToService.set(orderId, input.serviceId);
        orderToNeg.set(orderId, negotiationId);
        emit({ type: CrooEventType.OrderCreated, negotiationId, orderId });
      }, latency);
      return { negotiationId };
    },

    async getOrder(orderId: string) {
      return { negotiationId: orderToNeg.get(orderId) ?? "", serviceId: orderToService.get(orderId) ?? "" };
    },

    async getNegotiation(negotiationId: string) {
      return negStore.get(negotiationId) ?? { serviceId: "", requirements: "" };
    },

    async pay(orderId: string) {
      await new Promise((r) => setTimeout(r, 25));
      setTimeout(() => emit({ type: CrooEventType.OrderCompleted, orderId }), latency);
      return { txHash: mkId("0xtx") };
    },

    async getDelivery(orderId: string): Promise<DeliveryResult> {
      const serviceId = orderToService.get(orderId);
      const role = serviceId ? roleByService[serviceId] : undefined;
      if (role && deliverables[role]) return deliverables[role];
      return { deliverableType: "text", deliverableText: `mock result (${role ?? "unknown"})` };
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
