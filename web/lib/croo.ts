const PUBLIC = process.env.CROO_PUBLIC_API ?? "https://api.croo.network/backend/v1/public";

export interface CapoStats {
  name: string;
  status: string;
  online: string;
  completedOrders: number;
  totalVolume: string;
  completionRate: string;
}

export async function getCapoStats(): Promise<CapoStats | null> {
  const id = process.env.CAPO_AGENT_ID;
  if (!id) return null;
  try {
    const r = await fetch(`${PUBLIC}/agents/${id}`, { next: { revalidate: 30 } });
    if (!r.ok) return null;
    const a = (await r.json()).agent;
    return {
      name: a.name ?? "Capo",
      status: a.status ?? "",
      online: a.onlineStatus ?? "",
      completedOrders: Number(a.completedOrders ?? 0),
      totalVolume: a.totalVolume ?? "0",
      completionRate: a.completionRate ?? "0",
    };
  } catch {
    return null;
  }
}

export interface RosterAgent {
  name: string;
  role: string;
  loop: "brief" | "vet" | "execute";
}

export const ROSTER: RosterAgent[] = [
  { name: "AlphaTrack", role: "Smart-money moves", loop: "brief" },
  { name: "Polymind", role: "Trending events", loop: "brief" },
  { name: "SwapCat", role: "Prices & liquidity", loop: "brief" },
  { name: "DCA Signal", role: "Market mood", loop: "brief" },
  { name: "WhaleScope", role: "Whale positions", loop: "brief" },
  { name: "Web3 Risk", role: "Wallet & token risk", loop: "vet" },
  { name: "ChainGuard", role: "Contract audit", loop: "vet" },
  { name: "SwapGod", role: "Swap execution", loop: "execute" },
];
