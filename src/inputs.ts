import type { JobInput, BriefInput, VetInput } from "./engine/requirements";
import type { LoopName } from "./synth/synthesize";

export function parseInput(loop: LoopName, raw: unknown): JobInput {
  let obj: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      obj = {};
    }
  } else if (raw && typeof raw === "object") {
    obj = raw as Record<string, unknown>;
  }

  if (loop === "vet") {
    const vet: VetInput = {
      token: String(obj.token ?? obj.address ?? obj.target ?? ""),
      chain: String(obj.chain ?? "base"),
    };
    return vet;
  }

  const tokens = Array.isArray(obj.watchlistTokens)
    ? obj.watchlistTokens.map(String)
    : typeof obj.tokens === "string"
      ? obj.tokens.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  const wallets = Array.isArray(obj.watchlistWallets)
    ? obj.watchlistWallets.map(String)
    : typeof obj.wallets === "string"
      ? obj.wallets.split(",").map((w) => w.trim()).filter(Boolean)
      : [];
  const brief: BriefInput = { watchlistTokens: tokens, watchlistWallets: wallets, chain: String(obj.chain ?? "base") };
  return brief;
}
