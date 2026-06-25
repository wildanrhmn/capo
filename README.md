# Capo

**An on-chain crypto copilot that hires other CROO agents on your behalf.**

Capo is a CROO agent that, when hired, becomes a *buyer*: it fans out to a curated roster of specialist agents already live on the [CROO Agent Store](https://agent.croo.network), pays each in USDC, and synthesizes one clean answer. Two loops:

- **Daily Brief** — hires AlphaTrack (smart money) + WhaleScope (whale positions) + Polymind (events) + SwapCat (prices) + DCA Signal (market mood) → one personalized brief.
- **Vet a Token** — hires Web3 Address Intel & Risk + ChainGuard (contract audit) + SwapCat (price/liquidity) → a scored safe/caution/scam verdict. After a safe verdict the user can execute a swap via SwapGod (the user is the requestor — Capo never custodies funds).

Every run emits real agent-to-agent CAP orders to multiple counterparties — that A2A fan-out is the core of the product.

## Architecture

```
User ──hire──▶ Capo (provider)
                 │  fan-out (requester): negotiate ▶ pay(sequential) ▶ getDelivery
                 ├─▶ AlphaTrack / WhaleScope / Polymind / SwapCat / DCA Signal      (brief)
                 ├─▶ Web3 Risk / ChainGuard / SwapCat                               (vet)
                 └─▶ SwapGod                                                        (execute, user-signed)
                 │  synthesize (Claude Haiku, source-attributed, rule-based verdict floor)
                 ▼
              deliver one brief / verdict
```

- `src/croo/publicApi.ts` — CROO public discovery API (`api.croo.network/backend/v1/public`), used to resolve sub-agent `serviceId`s, input schemas, and liveness (the only source for service IDs — they are not in the SDK or store UI).
- `src/roster.ts` — the curated roster + live resolver.
- `src/engine/` — fan-out orchestrator (parallel negotiate, **sequential pay queue** for the AA-nonce constraint), requirement builder, pay queue.
- `src/synth/` — synthesis (Claude Haiku 4.5; deterministic fallback when no key).
- `src/croo/realGateway.ts` — wraps `@croo-network/sdk` `AgentClient` (single client, one WebSocket, dual provider/requester role).
- `src/croo/mockGateway.ts` — simulates the lifecycle for offline tests.
- `src/provider.ts` + `src/runtime.ts` — Capo as a provider: accept → on paid, run loop → deliver.

## CAP SDK methods used (`@croo-network/sdk`)

`negotiateOrder`, `acceptNegotiation`, `payOrder`, `deliverOrder`, `getOrder`, `getNegotiation`, `getDelivery`, `connectWebSocket` (events: `order_created`, `order_paid`, `order_completed`, `order_negotiation_rejected`, `order_expired`, …). Chain: Base mainnet, USDC, gas sponsored. Platform fee: 10% (read live from CAPVault).

## Run

```bash
npm install
cp .env.example .env      # fill in the values below

npm run roster            # resolve the live roster (no credentials needed)
npm run simulate          # full brief loop over a mock gateway (no credentials needed)
npm run typecheck
npm start                 # go live (requires CROO_SDK_KEY + CAPO_AGENT_ID + service IDs)
```

### Going live (one-time setup on agent.croo.network)

1. Register an agent named **Capo** → save its `croo_sk_...` key and agent UUID. Fund its AA wallet with a small USDC float on Base (~$10–15).
2. Register two services on Capo:
   - **Daily Brief** — Deliverable: Text. Requirements (Schema): `tokens` (string, comma-separated), `wallets` (string, optional), `chain` (string). Suggested price 0.99 USDC.
   - **Vet Token** — Deliverable: Text. Requirements (Schema): `token` (string, address), `chain` (string). Suggested price 0.79 USDC.
3. Put the values in `.env`: `CROO_SDK_KEY`, `CAPO_AGENT_ID`, `CAPO_SERVICE_BRIEF`, `CAPO_SERVICE_VET`, and `ANTHROPIC_API_KEY` (for Haiku synthesis; omit to use the deterministic fallback).
4. `npm start`.

## License

MIT
