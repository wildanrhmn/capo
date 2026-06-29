import type { CrooGateway } from "./croo/gateway";
import type { ResolvedRosterEntry } from "./roster";
import { buildRequirements } from "./engine/requirements";
import type { JobInput, BriefInput } from "./engine/requirements";
import { runFanout } from "./engine/orchestrator";
import type { SubTask, SubResult } from "./engine/orchestrator";
import type { PayQueue } from "./engine/payQueue";
import { synthesize } from "./synth/synthesize";
import type { LoopName, Synthesis } from "./synth/synthesize";

export interface LoopResult {
  loop: LoopName;
  results: SubResult[];
  synthesis: Synthesis;
  spent: string;
}

export interface RunLoopOptions {
  deadlineMs?: number;
  log?: (msg: string) => void;
}

function selectEntries(loop: LoopName, entries: ResolvedRosterEntry[], input: JobInput): ResolvedRosterEntry[] {
  if (loop !== "brief") return entries;
  const wallets = (input as BriefInput).watchlistWallets ?? [];
  if (wallets.length > 0) return entries;
  return entries.filter((e) => e.role !== "whalePositions");
}

export async function runLoop(
  gateway: CrooGateway,
  loop: LoopName,
  entries: ResolvedRosterEntry[],
  input: JobInput,
  payQueue: PayQueue,
  options: RunLoopOptions = {},
): Promise<LoopResult> {
  const active = selectEntries(loop, entries, input);
  const tasks: SubTask[] = active.map((e) => ({
    role: e.role,
    agentName: e.agentName,
    serviceId: e.serviceId,
    price: e.price,
    requirements: buildRequirements(e, input),
  }));

  const results = await runFanout(gateway, tasks, {
    payQueue,
    deadlineMs: options.deadlineMs ?? 120_000,
    log: options.log,
  });

  const synthesis = await synthesize(loop, input, results);
  const spent = String(results.reduce((sum, r) => sum + Number(r.costPaid), 0));

  return { loop, results, synthesis, spent };
}
