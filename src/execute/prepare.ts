import { resolveToken, isAddress } from "./tokens";

export const SWAPGOD_AGENT = "70b70042-7cdd-4e6b-bebf-7abd25a22d83";
export const SWAPGOD_SERVICE = "7a23fc72-62e1-4e74-826f-27bf0b8e68d1";

export interface ExecutePrepareInput {
  token: string;
  amountUsd: number;
  recipient: string;
  slippageBps?: number;
}

export interface PreparedSwap {
  ok: boolean;
  error?: string;
  tokenSymbol?: string;
  tokenOut?: string;
  tokenVerified?: boolean;
  recipient?: string;
  principalAmount?: number;
  slippageBps?: number;
  serviceId: string;
  agentId: string;
  storeUrl?: string;
  order?: Record<string, unknown>;
}

export function prepareSwap(input: ExecutePrepareInput, storeBase: string): PreparedSwap {
  const base: PreparedSwap = { ok: false, serviceId: SWAPGOD_SERVICE, agentId: SWAPGOD_AGENT };

  const amount = Number(input.amountUsd);
  if (!Number.isFinite(amount) || amount <= 0) return { ...base, error: "Enter a USDC amount greater than 0." };
  if (amount < 1) return { ...base, error: "Minimum swap is 1 USDC." };

  if (!isAddress(input.recipient ?? "")) return { ...base, error: "Recipient must be a valid 0x wallet address." };

  const token = resolveToken(input.token ?? "");
  if (!token) return { ...base, error: "Unknown token. Use a listed symbol or paste the token's 0x address." };

  const slippageBps = Number.isFinite(Number(input.slippageBps)) ? Math.max(10, Math.min(2000, Number(input.slippageBps))) : 100;

  return {
    ...base,
    ok: true,
    tokenSymbol: token.symbol,
    tokenOut: token.address,
    tokenVerified: token.verified,
    recipient: input.recipient.trim(),
    principalAmount: amount,
    slippageBps,
    storeUrl: `${storeBase.replace(/\/$/, "")}/agents/${SWAPGOD_AGENT}`,
    order: {
      principal_amount: amount,
      token_out: token.address,
      recipient: input.recipient.trim(),
      slippage_bps: slippageBps,
    },
  };
}
