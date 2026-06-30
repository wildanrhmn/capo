import type { CrooGateway, CrooEvent } from "./croo/gateway";
import { CrooEventType } from "./croo/gateway";
import type { RosterResolution } from "./roster";
import { rosterForLoop } from "./roster";
import { runLoop } from "./loops";
import type { LoopName } from "./synth/synthesize";
import type { JobInput } from "./engine/requirements";
import type { PayQueue } from "./engine/payQueue";

export interface ProviderConfig {
  capoAgentId: string;
  serviceLoops: Record<string, LoopName>;
  resolution: RosterResolution;
  payQueue: PayQueue;
  parseInput: (loop: LoopName, requirements: string) => JobInput;
  passServiceId?: string;
  onPass?: (orderId: string) => Promise<string>;
  log?: (msg: string) => void;
}

export interface ProviderHandle {
  fulfillPaidBacklog: () => Promise<void>;
}

export function setupProvider(gateway: CrooGateway, cfg: ProviderConfig): ProviderHandle {
  const log = cfg.log ?? (() => {});
  const handled = new Set<string>();

  gateway.on((e: CrooEvent) => {
    if (e.type === CrooEventType.NegotiationCreated && e.negotiationId) {
      void onNegotiation(e.negotiationId, e.serviceId);
    } else if (e.type === CrooEventType.OrderPaid && e.orderId) {
      void onPaid(e.orderId, e.serviceId, e.negotiationId);
    }
  });

  async function onNegotiation(negotiationId: string, serviceIdHint?: string): Promise<void> {
    try {
      let serviceId = serviceIdHint;
      if (!serviceId) serviceId = (await gateway.getNegotiation(negotiationId)).serviceId;
      if (!serviceId || !(serviceId in cfg.serviceLoops)) {
        log(`ignoring negotiation ${negotiationId} (service ${serviceId ?? "unknown"})`);
        return;
      }
      const { orderId } = await gateway.acceptNegotiation(negotiationId);
      log(`accepted negotiation ${negotiationId} -> order ${orderId}`);
    } catch (err) {
      log(`accept failed for ${negotiationId}: ${(err as Error).message}`);
    }
  }

  async function onPaid(orderId: string, serviceIdHint?: string, negotiationIdHint?: string): Promise<void> {
    if (handled.has(orderId)) return;
    handled.add(orderId);
    try {
      let serviceId = serviceIdHint;
      let negotiationId = negotiationIdHint;
      if (!serviceId || !negotiationId) {
        const o = await gateway.getOrder(orderId);
        serviceId = serviceId ?? o.serviceId;
        negotiationId = negotiationId ?? o.negotiationId;
      }
      if (cfg.passServiceId && serviceId === cfg.passServiceId && cfg.onPass) {
        const text = await cfg.onPass(orderId);
        await gateway.deliver(orderId, { deliverableType: "text", deliverableText: text });
        log(`issued Capo Pass for order ${orderId}`);
        return;
      }
      const loop = serviceId ? cfg.serviceLoops[serviceId] : undefined;
      if (!loop) {
        log(`paid order ${orderId}: service ${serviceId ?? "unknown"} is not one of ours, skipping`);
        return;
      }
      await runJob(orderId, loop, negotiationId);
    } catch (err) {
      handled.delete(orderId);
      log(`job failed for ${orderId}: ${(err as Error).message}`);
    }
  }

  async function runJob(orderId: string, loop: LoopName, negotiationId?: string): Promise<void> {
    const negId = negotiationId ?? (await gateway.getOrder(orderId)).negotiationId;
    const neg = await gateway.getNegotiation(negId);
    const input = cfg.parseInput(loop, neg.requirements);
    const entries = rosterForLoop(cfg.resolution, loop);
    log(`running "${loop}" for order ${orderId}`);

    const out = await runLoop(gateway, loop, entries, input, cfg.payQueue, { deadlineMs: 180_000, log });
    await gateway.deliver(orderId, { deliverableType: "text", deliverableText: out.synthesis.markdown });

    const ok = out.results.filter((r) => r.status === "completed").length;
    log(`delivered "${loop}" order ${orderId}: ${ok}/${out.results.length} sources, spent ${out.spent}, confidence ${out.synthesis.confidence}`);
  }

  async function fulfillPaidBacklog(): Promise<void> {
    try {
      const orders = await gateway.listOrders({ role: "provider", status: "paid" });
      if (orders.length > 0) log(`backlog: ${orders.length} paid order(s) awaiting fulfillment`);
      for (const o of orders) {
        await onPaid(o.orderId, o.serviceId, o.negotiationId);
      }
    } catch (err) {
      log(`backlog scan failed: ${(err as Error).message}`);
    }
  }

  return { fulfillPaidBacklog };
}
