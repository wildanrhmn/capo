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
  log?: (msg: string) => void;
}

export function setupProvider(gateway: CrooGateway, cfg: ProviderConfig): void {
  const log = cfg.log ?? (() => {});
  const handled = new Set<string>();

  gateway.on((e: CrooEvent) => {
    if (e.providerAgentId !== cfg.capoAgentId) return;

    if (e.type === CrooEventType.NegotiationCreated && e.negotiationId) {
      if (!e.serviceId || !(e.serviceId in cfg.serviceLoops)) {
        log(`ignoring negotiation for unconfigured service ${e.serviceId ?? "?"}`);
        return;
      }
      gateway
        .acceptNegotiation(e.negotiationId)
        .then(({ orderId }) => log(`accepted negotiation ${e.negotiationId} -> order ${orderId}`))
        .catch((err: unknown) => log(`accept failed: ${(err as Error).message}`));
      return;
    }

    if (e.type === CrooEventType.OrderPaid && e.orderId) {
      const serviceId = e.serviceId;
      const loop = serviceId ? cfg.serviceLoops[serviceId] : undefined;
      if (!loop) return;
      if (handled.has(e.orderId)) return;
      handled.add(e.orderId);
      runJob(e.orderId, loop, e.negotiationId).catch((err: unknown) => log(`job failed: ${(err as Error).message}`));
    }
  });

  async function runJob(orderId: string, loop: LoopName, negotiationId?: string): Promise<void> {
    const negId = negotiationId ?? (await gateway.getOrder(orderId)).negotiationId;
    const neg = await gateway.getNegotiation(negId);
    const input = cfg.parseInput(loop, neg.requirements);
    const entries = rosterForLoop(cfg.resolution, loop);
    log(`running "${loop}" for order ${orderId} over ${entries.length} sub-agents`);

    const out = await runLoop(gateway, loop, entries, input, cfg.payQueue, { log });
    await gateway.deliver(orderId, { deliverableType: "text", deliverableText: out.synthesis.markdown });

    const ok = out.results.filter((r) => r.status === "completed").length;
    log(`delivered "${loop}" order ${orderId}: ${ok}/${out.results.length} sources, spent ${out.spent}, confidence ${out.synthesis.confidence}`);
  }
}
