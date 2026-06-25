export interface CrooEvent {
  type: string;
  orderId?: string;
  negotiationId?: string;
  serviceId?: string;
  requesterAgentId?: string;
  providerAgentId?: string;
  status?: string;
  reason?: string;
}

export interface NegotiateInput {
  serviceId: string;
  requirements: string;
}

export interface DeliveryResult {
  deliverableType: string;
  deliverableText?: string;
  deliverableSchema?: string;
}

export type EventHandler = (e: CrooEvent) => void;

export interface CrooGateway {
  negotiate(input: NegotiateInput): Promise<{ negotiationId: string }>;
  pay(orderId: string): Promise<{ txHash: string }>;
  getDelivery(orderId: string): Promise<DeliveryResult>;
  getOrder(orderId: string): Promise<{ negotiationId: string; serviceId: string }>;
  getNegotiation(negotiationId: string): Promise<{ serviceId: string; requirements: string }>;
  acceptNegotiation(negotiationId: string): Promise<{ orderId: string }>;
  deliver(orderId: string, result: DeliveryResult): Promise<void>;
  on(handler: EventHandler): void;
  off(handler: EventHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const CrooEventType = {
  NegotiationCreated: "order_negotiation_created",
  NegotiationRejected: "order_negotiation_rejected",
  NegotiationExpired: "order_negotiation_expired",
  OrderCreated: "order_created",
  OrderPaid: "order_paid",
  OrderCompleted: "order_completed",
  OrderRejected: "order_rejected",
  OrderExpired: "order_expired",
} as const;
