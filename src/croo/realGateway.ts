import { AgentClient } from "@croo-network/sdk";
import type { CrooGateway, CrooEvent, EventHandler, NegotiateInput, DeliveryResult } from "./gateway";

export interface RealGatewayConfig {
  baseURL: string;
  wsURL: string;
  rpcURL: string;
}

export function createRealGateway(config: RealGatewayConfig, sdkKey: string): CrooGateway {
  const client = new AgentClient({ baseURL: config.baseURL, wsURL: config.wsURL, rpcURL: config.rpcURL }, sdkKey);
  const handlers = new Set<EventHandler>();
  let stream: Awaited<ReturnType<AgentClient["connectWebSocket"]>> | undefined;

  return {
    async negotiate(input: NegotiateInput) {
      const n = await client.negotiateOrder({ serviceId: input.serviceId, requirements: input.requirements });
      return { negotiationId: n.negotiationId };
    },
    async pay(orderId: string) {
      const r = await client.payOrder(orderId);
      return { txHash: r.txHash };
    },
    async getDelivery(orderId: string): Promise<DeliveryResult> {
      const d = await client.getDelivery(orderId);
      return { deliverableType: d.deliverableType, deliverableText: d.deliverableText, deliverableSchema: d.deliverableSchema };
    },
    async getOrder(orderId: string) {
      const o = await client.getOrder(orderId);
      return { negotiationId: o.negotiationId, serviceId: o.serviceId };
    },
    async getNegotiation(negotiationId: string) {
      const n = await client.getNegotiation(negotiationId);
      return { serviceId: n.serviceId, requirements: n.requirements };
    },
    async acceptNegotiation(negotiationId: string) {
      const r = await client.acceptNegotiation(negotiationId);
      return { orderId: r.order.orderId };
    },
    async deliver(orderId: string, result: DeliveryResult) {
      await client.deliverOrder(orderId, {
        deliverableType: result.deliverableType,
        deliverableText: result.deliverableText,
        deliverableSchema: result.deliverableSchema,
      });
    },
    on(handler: EventHandler) {
      handlers.add(handler);
    },
    off(handler: EventHandler) {
      handlers.delete(handler);
    },
    async start() {
      stream = await client.connectWebSocket();
      stream.onAny((e) => {
        const ce: CrooEvent = {
          type: e.type,
          orderId: e.order_id,
          negotiationId: e.negotiation_id,
          serviceId: e.service_id,
          requesterAgentId: e.requester_agent_id,
          providerAgentId: e.provider_agent_id,
          status: e.status,
          reason: e.reason,
        };
        handlers.forEach((h) => h(ce));
      });
    },
    async stop() {
      stream?.close();
    },
  };
}
