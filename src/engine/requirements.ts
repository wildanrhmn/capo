import type { ResolvedRosterEntry } from "../roster";

export interface BriefInput {
  watchlistTokens: string[];
  watchlistWallets: string[];
  chain: string;
}

export interface VetInput {
  token: string;
  chain: string;
}

export type JobInput = BriefInput | VetInput;

function isVet(input: JobInput): input is VetInput {
  return (input as VetInput).token !== undefined;
}

export function buildRequirements(entry: ResolvedRosterEntry, input: JobInput): string {
  const useSchema = entry.requirementType === "schema";
  const json = (obj: Record<string, unknown>): string => JSON.stringify(obj);

  switch (entry.role) {
    case "smartMoney":
    case "marketMood":
      return useSchema ? "{}" : "";

    case "whalePositions": {
      const wallet = isVet(input) ? "" : input.watchlistWallets[0] ?? "";
      return useSchema ? json({ wallet }) : wallet;
    }

    case "events":
      return useSchema ? json({ limit: 5 }) : "trending market events";

    case "prices": {
      const tokens = isVet(input) ? input.token : input.watchlistTokens.join(",") || "ETH";
      return useSchema ? json({ tokens, chain: input.chain }) : `${tokens} on ${input.chain}`;
    }

    case "walletRisk": {
      const target = isVet(input) ? input.token : input.watchlistWallets[0] ?? "";
      return useSchema ? json({ walletAddresses: [target], chain: input.chain }) : `Assess risk for ${target} on ${input.chain}`;
    }

    case "contractAudit": {
      const target = isVet(input) ? input.token : "";
      return useSchema ? json({ address: target }) : `Audit contract ${target}`;
    }

    case "execute":
      return useSchema ? "{}" : "";

    default:
      return useSchema ? "{}" : "";
  }
}
