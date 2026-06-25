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
  log?: (msg: string) => void;
}

interface Pending {
  task: SubTask;
  orderId?: string;
  settled: boolean;
  resolve: (r: SubResult) => void;
}

export async function runFanout(gateway: CrooGateway, tasks: SubTask[], opts: FanoutOptions): Promise<SubResult[]> {
  const log = opts.log ?? (() => {});
  const byNegotiation = new Map<string, Pending>();
  const byOrder = new Map<string, Pending>();

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
    const p =
      (e.orderId ? byOrder.get(e.orderId) : undefined) ??
      (e.negotiationId ? byNegotiation.get(e.negotiationId) : undefined);
    if (!p || p.settled) return;

    switch (e.type) {
      case CrooEventType.OrderCreated:
        if (e.orderId) {
          const orderId = e.orderId;
          p.orderId = orderId;
          byOrder.set(orderId, p);
          opts.payQueue
            .enqueue(() => gateway.pay(orderId))
            .then(() => log(`paid ${p.task.agentName}`))
            .catch((err: unknown) => settle(p, { status: "failed", error: `pay: ${(err as Error).message}` }));
        }
        break;
      case CrooEventType.OrderCompleted:
        if (p.orderId) {
          gateway
            .getDelivery(p.orderId)
            .then((d) =>
              settle(p, {
                status: "completed",
                deliverableType: d.deliverableType,
                deliverableText: d.deliverableText,
                deliverableSchema: d.deliverableSchema,
              }),
            )
            .catch((err: unknown) => settle(p, { status: "failed", error: `getDelivery: ${(err as Error).message}` }));
        }
        break;
      case CrooEventType.NegotiationRejected:
      case CrooEventType.NegotiationExpired:
      case CrooEventType.OrderRejected:
      case CrooEventType.OrderExpired:
        settle(p, { status: "failed", error: e.type });
        break;
    }
  };

  gateway.on(handler);

  const results = tasks.map(
    (task) =>
      new Promise<SubResult>((resolve) => {
        const p: Pending = { task, settled: false, resolve };
        gateway
          .negotiate({ serviceId: task.serviceId, requirements: task.requirements })
          .then(({ negotiationId }) => {
            if (p.settled) return;
            byNegotiation.set(negotiationId, p);
          })
          .catch((err: unknown) => settle(p, { status: "failed", error: `negotiate: ${(err as Error).message}` }));
      }),
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<"deadline">((res) => {
    timer = setTimeout(() => res("deadline"), opts.deadlineMs);
  });
  const outcome = await Promise.race([Promise.all(results).then(() => "all" as const), deadline]);

  if (outcome === "deadline") {
    for (const p of new Set([...byNegotiation.values(), ...byOrder.values()])) {
      settle(p, { status: "failed", error: "run_deadline" });
    }
  }
  if (timer) clearTimeout(timer);
  gateway.off(handler);
  return Promise.all(results);
}
