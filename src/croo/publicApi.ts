const BASE = process.env.CROO_PUBLIC_API ?? "https://api.croo.network/backend/v1/public";

export interface PublicService {
  serviceId: string;
  name: string;
  price: string;
  slaMinutes: number;
  description: string;
  requirementType: string;
  requirementText: string;
  requirementSchema: string;
  deliverableType: string;
  deliverableText: string;
  deliverableSchema: string;
}

export interface PublicAgent {
  agentId: string;
  name: string;
  status: string;
  onlineStatus: string;
  walletAddress?: string;
  minServicePrice: string;
  completionRate?: string;
  services?: PublicService[];
}

export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  stringSubtype?: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`CROO public API ${path} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function listAgents(pageSize = 100): Promise<PublicAgent[]> {
  const data = await get<{ agents: PublicAgent[]; total: number }>(`/agents?page=1&page_size=${pageSize}`);
  return data.agents ?? [];
}

export async function getAgent(agentId: string): Promise<PublicAgent> {
  const data = await get<{ agent: PublicAgent }>(`/agents/${agentId}`);
  return data.agent;
}

export function parseSchema(raw: string): SchemaField[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as SchemaField[]) : [];
  } catch {
    return [];
  }
}

export function pickService(agent: PublicAgent, preferredName?: string): PublicService | undefined {
  const services = agent.services ?? [];
  if (services.length === 0) return undefined;
  if (preferredName) {
    const match = services.find((s) => s.name.toLowerCase() === preferredName.toLowerCase());
    if (match) return match;
  }
  return services[0];
}
