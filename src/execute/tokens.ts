export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

// Curated, high-confidence Base mainnet tokens. Anything not here must be
// supplied as a raw 0x address by the user (and confirmed on CROO before paying).
export const BASE_TOKENS: Record<string, TokenInfo> = {
  USDC: { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  WETH: { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  AERO: { symbol: "AERO", address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18 },
  CBBTC: { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  DEGEN: { symbol: "DEGEN", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", decimals: 18 },
};

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export interface ResolvedToken {
  symbol: string;
  address: string;
  verified: boolean;
}

export function resolveToken(input: string): ResolvedToken | null {
  const raw = input.trim();
  if (!raw) return null;
  if (ADDRESS_RE.test(raw)) {
    const known = Object.values(BASE_TOKENS).find((t) => t.address.toLowerCase() === raw.toLowerCase());
    return known ? { symbol: known.symbol, address: known.address, verified: true } : { symbol: "token", address: raw, verified: false };
  }
  const hit = BASE_TOKENS[raw.toUpperCase()];
  return hit ? { symbol: hit.symbol, address: hit.address, verified: true } : null;
}

export function isAddress(input: string): boolean {
  return ADDRESS_RE.test(input.trim());
}
