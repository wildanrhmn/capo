import type { CrooGateway, CrooEvent, EventHandler } from "../croo/gateway";
import { CrooEventType } from "../croo/gateway";
import type { PayQueue } from "./payQueue";

export interface SubTask {
  role: string;
  agentName: string;
  serviceId: string;
  requirements: string;
  price: string;
}

export interface SubResult {
  role: string;
  agentName: string;
  serviceId: string;
  status: "completed" | "failed";
  deliverableType?: string;
  deliverableText?: string;
  deliverableSchema?: string;
  error?: string;
  costPaid: string;
}

export interface FanoutOptions {
  payQueue: PayQueue;
  deadlineMs: number;
  pollMs?: number;
  log?: (msg: string) => void;
}

interface Pending {
  task: SubTask;
  orderId?: string;
  paying: boolean;
  settled: boolean;
  resolve: (r: SubResult) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TERMINAL_FAIL = ["rejected", "expired", "pay_failed", "deliver_failed", "create_failed"];

export async function runFanout(gateway: CrooGateway, tasks: SubTask[], opts: FanoutOptions): Promise<SubResult[]> {
  const log = opts.log ?? (() => {});
  const pollMs = opts.pollMs ?? 3000;
  const deadlineAt = Date.now() + opts.deadlineMs;
  const byNegotiation = new Map<string, Pending>();

  function settle(p: Pending, partial: Partial<SubResult> & { status: "completed" | "failed" }): void {
    if (p.settled) return;
    p.settled = true;
    p.resolve({
      role: p.task.role,
      agentName: p.task.agentName,
      serviceId: p.task.serviceId,
      costPaid: partial.status === "completed" ? p.task.price : "0",
      ...partial,
    });
  }

  const handler: EventHandler = (e: CrooEvent) => {
    if (!e.negotiationId) return;
    const p = byNegotiation.get(e.negotiationId);
    if (!p || p.settled) return;
    if (
      e.type === CrooEventType.NegotiationRejected ||
      e.type === CrooEventType.NegotiationExpired ||
      e.type === CrooEventType.OrderRejected ||
      e.type === CrooEventType.OrderExpired
    ) {
      settle(p, { status: "failed", error: e.type });
    }
  };
  gateway.on(handler);

  async function drive(p: Pending, negotiationId: string): Promise<void> {
    while (!p.settled && !p.orderId && Date.now() < deadlineAt) {
      await sleep(pollMs);
      if (p.settled || p.orderId) break;
      try {
        const orders = await gateway.listOrders({ role: "buyer", pageSize: 50 });
        const o = orders.find((x) => x.negotiationId === negotiationId);
        if (o && !p.orderId && !p.settled) {
          p.orderId = o.orderId;
          if (TERMINAL_FAIL.includes(o.status)) {
            settle(p, { status: "failed", error: o.status });
            return;
          }
        }
      } catch {
        /* keep polling */
      }
    }
    if (p.settled) return;
    if (!p.orderId) {
      settle(p, { status: "failed", error: "no order created (provider did not accept)" });
      return;
    }

    const orderId = p.orderId;
    while (!p.settled && Date.now() < deadlineAt) {
      let status = "";
      try {
        status = (await gateway.getOrder(orderId)).status;
      } catch {
        await sleep(pollMs);
        continue;
      }
      if (status === "completed") {
        try {
          const d = await gateway.getDelivery(orderId);
          settle(p, { status: "completed", deliverableType: d.deliverableType, deliverableText: d.deliverableText, deliverableSchema: d.deliverableSchema });
        } catch (err) {
          settle(p, { status: "failed", error: `getDelivery: ${(err as Error).message}` });
        }
        return;
      }
      if (TERMINAL_FAIL.includes(status)) {
        settle(p, { status: "failed", error: status });
        return;
      }
      if (status === "created" && !p.paying) {
        p.paying = true;
        opts.payQueue
          .enqueue(() => gateway.pay(orderId))
          .then(() => log(`paid ${p.task.agentName}`))
          .catch((err: unknown) => settle(p, { status: "failed", error: `pay: ${(err as Error).message}` }));
      }
      await sleep(pollMs);
    }
  }

  const results = tasks.map(
    (task) =>
      new Promise<SubResult>((resolve) => {
        const p: Pending = { task, paying: false, settled: false, resolve };
        gateway
          .negotiate({ serviceId: task.serviceId, requirements: task.requirements })
          .then(({ negotiationId }) => {
            if (p.settled) return;
            byNegotiation.set(negotiationId, p);
            void drive(p, negotiationId);
          })
          .catch((err: unknown) => settle(p, { status: "failed", error: `negotiate: ${(err as Error).message}` }));
      }),
  );

  const all = await Promise.race([
    Promise.all(results).then(() => "all" as const),
    sleep(opts.deadlineMs + pollMs).then(() => "deadline" as const),
  ]);
  if (all === "deadline") {
    for (const p of byNegotiation.values()) settle(p, { status: "failed", error: "run_deadline" });
  }
  gateway.off(handler);
  return Promise.all(results);
}
