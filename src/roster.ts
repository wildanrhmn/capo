import { getAgent, parseSchema, pickService } from "./croo/publicApi";
import type { SchemaField } from "./croo/publicApi";

export type RosterRole =
  | "smartMoney"
  | "whalePositions"
  | "events"
  | "prices"
  | "marketMood"
  | "walletRisk"
  | "contractAudit"
  | "execute";

export type LoopName = "brief" | "vet" | "execute";

export interface RosterEntry {
  role: RosterRole;
  agentName: string;
  agentId: string;
  serviceName?: string;
  loops: LoopName[];
}

export const ROSTER: RosterEntry[] = [
  { role: "smartMoney", agentName: "AlphaTrack", agentId: "e05abaea-a586-4954-bbcf-d5c93127a214", serviceName: "top_traders", loops: ["brief"] },
  { role: "whalePositions", agentName: "WhaleScope", agentId: "058802f5-6127-468e-bf76-28b1d4873e0d", serviceName: "wallet_positions", loops: ["brief"] },
  { role: "events", agentName: "Polymind", agentId: "49373b68-8c41-4c95-b162-e9343f104de4", serviceName: "hot_events", loops: ["brief"] },
  { role: "prices", agentName: "SwapCat", agentId: "ba90fcf8-d786-40d2-a81c-63a88624a2ed", serviceName: "Token Price", loops: ["brief", "vet"] },
  { role: "marketMood", agentName: "DCA Signal AI Agent", agentId: "9753b752-0ef0-404f-875e-adcbb222ca66", loops: ["brief"] },
  { role: "walletRisk", agentName: "Web3 Address Intel & Risk Agent", agentId: "d4fae743-5a14-45d0-8933-8b5e5cea7dc8", loops: ["vet"] },
  { role: "contractAudit", agentName: "ChainGuard", agentId: "74775115-cf3e-4bb7-bc97-7662b35bb21d", loops: ["vet"] },
  { role: "execute", agentName: "SwapGod", agentId: "70b70042-7cdd-4e6b-bebf-7abd25a22d83", serviceName: "SwapGod", loops: ["execute"] },
];

export interface ResolvedRosterEntry extends RosterEntry {
  serviceId: string;
  serviceDisplayName: string;
  price: string;
  slaMinutes: number;
  online: boolean;
  requirementType: string;
  requirementText: string;
  requirements: SchemaField[];
  deliverableType: string;
}

export interface RosterResolution {
  resolved: ResolvedRosterEntry[];
  problems: string[];
}

export async function resolveRoster(entries: RosterEntry[] = ROSTER): Promise<RosterResolution> {
  const resolved: ResolvedRosterEntry[] = [];
  const problems: string[] = [];

  for (const entry of entries) {
    try {
      const agent = await getAgent(entry.agentId);
      const online = agent.status === "active";
      const service = pickService(agent, entry.serviceName);
      if (!service) {
        problems.push(`${entry.agentName}: no hireable service found`);
        continue;
      }
      resolved.push({
        ...entry,
        serviceId: service.serviceId,
        serviceDisplayName: service.name,
        price: service.price,
        slaMinutes: service.slaMinutes,
        online,
        requirementType: service.requirementType,
        requirementText: service.requirementText,
        requirements: parseSchema(service.requirementSchema),
        deliverableType: service.deliverableType,
      });
      if (!online) problems.push(`${entry.agentName}: status="${agent.status}" (not active)`);
    } catch (err) {
      problems.push(`${entry.agentName}: ${(err as Error).message}`);
    }
  }

  return { resolved, problems };
}

export function rosterForLoop(resolution: RosterResolution, loop: LoopName): ResolvedRosterEntry[] {
  return resolution.resolved.filter((r) => r.loops.includes(loop) && r.online);
}
