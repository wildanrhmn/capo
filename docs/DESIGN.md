# Capo — Design Doc

> Working name: **Capo** (built on **CAP**; it commands a *crew* of agents on your behalf). Placeholder — alternatives: Sherpa, Syndic, Consigliere. Rename freely.

**One-liner:** Capo is an on-chain crypto copilot that hires the CROO Agent Store's existing specialist agents on your behalf, pays them in USDC per call, and returns one synthesized answer — a daily smart-money brief, a "should I buy this token" verdict, and one-tap execution.

**Category:** Open / A2A Composability (primary) + DeFi / On-chain Ops (secondary).

---

## 1. The problem (grounded in research, not vibes)

Serious crypto users run a daily, multi-tab routine across 5-6 fragmented tools (smart-money flows, whale positions, prices, events, risk/audit) and pay for several of them separately ($1-3K/yr stacking Nansen + Glassnode + TradingView etc.). "There is no single platform that gives you every bit of insight." The alpha is in *cross-confirming* signals that no single product holds.

On the CROO Agent Store specifically, the situation is worse and more interesting:
- The store has ~49 live agents, dominated by **near-identical single-purpose crypto-data agents** (WhaleScope, AlphaTrack, Polymind, SwapCat, BtcForecast…), almost all priced at **$0.10/call**.
- A buyer faces a pile of overlapping $0.10 tools and has to call each one separately and stitch the results by hand.
- **Real agent-to-agent composition barely exists.** Even the one generic composer on the store (Axion: "subcontracts a multi-agent task, escrows USDC per sub-hire") has **0 orders**. The actual order flow is uniform single-calls, much of it likely self-trade.

**Capo's wedge:** be the consumer front-end that turns that pile of raw single-purpose agents into one product people actually use — and in doing so, become the store's first *real* A2A orchestrator with genuine order flow.

## 2. Why this is impossible / much worse on a normal API marketplace

- **Trustless composition of priced strangers.** Capo pays mutually-untrusting agents per call with escrow per sub-hire and atomic on-chain settlement. A RapidAPI/Stripe marketplace can't let one independent agent hire five others it has no account relationship with and settle instantly.
- **It can act, not just inform.** The final hop routes a real swap through SwapGod on Base — scan → verify → **execute** — inside one composed flow.
- **The order graph is the moat.** Every Capo run emits real, diverse CAP orders to multiple counterparties. That on-chain composability graph is exactly what CROO scores (25%) and what a normal API marketplace structurally cannot produce.

## 3. Product

Capo is a registered CROO agent (has a wallet + DID + SDK key) that also ships a thin web console for humans. It exposes three CAP services and one habit loop.

### Loop A — Daily Smart-Money Brief (the retention engine)
User keeps a watchlist (tokens + wallets). On demand (and, v2, on a schedule) Capo hires the roster, synthesizes **one** personalized brief: "Here's what smart money did on your watchlist, what moved, what to watch."
- Sub-agents: AlphaTrack (smart-money) + WhaleScope (whale positions) + Polymind (events/sentiment) + SwapCat (prices) + DCA Signal (market mood).

### Loop B — Vet a Token (the wow)
User pastes a token address. Capo hires the risk/audit roster and returns a scored **safe / caution / scam** verdict with the evidence each sub-agent returned.
- Sub-agents: Web3 Address Intel & Risk + ChainGuard (contract audit) + VeriClaw (trust oracle) + SwapCat (price/liquidity).

### Loop C — Execute (one tap, optional, highest-risk — see §11)
After a "safe" verdict, one tap routes a swap through SwapGod (the store's only real executor) on Base/Aerodrome.

### Front door
- **Primary (required):** Capo is listed on the CROO Agent Store and callable via CAP, so humans (via store "Try this" / Navigator) and other agents can hire it.
- **Polish (for retention + demo):** a minimal "Capo Console" web app — connect wallet, set watchlist, trigger briefs/vetting, see the on-chain orders fire in real time. This is what makes the 5-min demo land.

## 4. The roster (real, live agents to compose)

All confirmed live and transacting during inventory (2026-06-25). Service IDs and per-service `requirements` schemas to be captured from each agent page during setup (Day 1) — **do not hardcode guessed IDs**.

| Role | Agent | Service | Price (USDC) | Agent page |
|---|---|---|---|---|
| smart-money | AlphaTrack | top_traders | 0.10 | /agents/e05abaea-a586-4954-bbcf-d5c93127a214 |
| whale positions | WhaleScope | wallet_positions | 0.10 | /agents/058802f5-6127-468e-bf76-28b1d4873e0d |
| events/sentiment | Polymind | hot_events | 0.10 | /agents/49373b68-8c41-4c95-b162-e9343f104de4 |
| prices/gas/liquidity | SwapCat | Token Price / Gas Tracker | 0.10 | /agents/ba90fcf8-d786-40d2-a81c-63a88624a2ed |
| market mood | DCA Signal | Bitcoin DCA Signal | 0.10 | (from store) |
| wallet/token risk | Web3 Address Intel & Risk | Address Risk Report | 0.10 | /agents/d4fae743-5a14-45d0-8933-8b5e5cea7dc8 |
| contract audit | ChainGuard | Smart Contract Audit | 0.10 | /agents/74775115-cf3e-4bb7-bc97-7662b35bb21d |
| safety verdict | VeriClaw | Trust Oracle | 0.03 | /agents/789a99f3-0b92-4823-87f0-2246547b1247 |
| execution | SwapGod | swap | 0.10 | /agents/70b70042-7cdd-4e6b-bebf-7abd25a22d83 |

Design the roster as **config, not code** (a JSON manifest of {role, serviceId, requirementsTemplate, price}). Swapping an unreliable agent or adding one must be a config edit, never a redeploy. Each role should allow a **fallback agent** so one flaky provider doesn't break a run.

## 5. Architecture

```
                Human (Capo Console / Navigator)        Other agents
                          │  H2A order                      │ A2A order
                          ▼                                 ▼
                 ┌───────────────────────── CAPO AGENT ─────────────────────────┐
                 │  one AgentClient (croo_sk_…) · one WebSocket                   │
                 │                                                               │
                 │  PROVIDER side          ORCHESTRATOR core        REQUESTER side│
                 │  on NegotiationCreated   build plan from          negotiate→pay │
                 │   → acceptNegotiation    requirements; fan out;   →getDelivery  │
                 │  on OrderPaid            collect; synthesize;      (sequential  │
                 │   → run job → deliver    deliver to user          pay queue)    │
                 └───────────────────────────────┬───────────────────────────────┘
                                                  │ negotiate (parallel) + pay (SEQUENTIAL)
                          ┌───────────────┬───────┴───────┬───────────────┐
                          ▼               ▼               ▼               ▼
                      AlphaTrack      WhaleScope        SwapCat   …   SwapGod (execute)
```

**Single client, dual role.** Capo runs one `AgentClient` and one WebSocket (the API key allows only one active WS). It distinguishes inbound *provider* work (`NegotiationCreated`/`OrderPaid` where it is the provider) from *requester* events for orders it placed (`OrderCreated`/`OrderCompleted`). Use `listNegotiations({role:'provider'})` vs `listOrders` to disambiguate; track its own outbound order IDs in a map.

**Fan-out engine.**
1. On user `OrderPaid`, parse `requirements` → build the run plan (which roles, what inputs).
2. `negotiateOrder` to each roster agent — **parallel is fine** for negotiate.
3. As each sub `OrderCreated` arrives, enqueue a `payOrder`. **Drain the queue one at a time** (AA nonce constraint). Idempotency-safe; retry on transient `PIMLICO_ERROR`/`NONCE_ERROR`.
4. Collect each sub `OrderCompleted` → `getDelivery`. Apply a per-sub **timeout** (their SLA) and a global run deadline well inside Capo's own SLA.
5. Synthesize → `deliverOrder` to the user. Partial results are allowed (see §8).

**Treasury / working capital.** The user's payment is locked in CAPVault escrow until Capo delivers, so Capo must pre-fund its AA wallet with a USDC **float** to pay sub-agents up front. Float ≈ (max sub-cost per run) × (max concurrent runs). At ~$0.50/run and, say, 20 concurrent runs, ~$10-15. Reconciliation: track spent-vs-earned per run; the escrowed user fee reimburses the float on clear.

**State.** Persist every run: user order ID → {sub order IDs, statuses, costs, deliverables, synthesized output}. Lightweight (SQLite/JSON) is enough for v1; needed for idempotency, retries, refunds, and the demo dashboard.

**Stack:** Node 18+ / TypeScript, `@croo-network/sdk`, a small Express service for the console API, the synthesis LLM (Claude — `claude-opus-4-8` for quality, or `claude-haiku-4-5` for cheap/fast synthesis), SQLite. Next.js for the console.

## 6. CAP integration (exact calls — grounded in the real SDK)

Provider side (Capo is hired):
```ts
const client = new AgentClient(
  { baseURL: process.env.CROO_API_URL!, wsURL: process.env.CROO_WS_URL! },
  process.env.CROO_SDK_KEY!,
);
const stream = await client.connectWebSocket();

stream.on(EventType.NegotiationCreated, async (e) => {
  await client.acceptNegotiation(e.negotiation_id!);       // creates on-chain order
});
stream.on(EventType.OrderPaid, async (e) => {
  if (isMyProviderOrder(e.order_id!)) await runJob(e.order_id!); // fan-out + synthesize + deliver
});
```

Requester side (Capo hires the roster), with the sequential-pay queue:
```ts
async function hire(role, serviceId, requirements) {
  const neg = await client.negotiateOrder({ serviceId, requirements: JSON.stringify(requirements) });
  return neg.negotiationId; // sub-provider auto-accepts → OrderCreated arrives on the stream
}
stream.on(EventType.OrderCreated, (e) => { if (isMyOutboundOrder(e.order_id!)) payQueue.push(e.order_id!); });
// drain queue strictly one-at-a-time:
async function drainPayQueue() {
  while (true) { const id = await payQueue.take(); await client.payOrder(id); } // never concurrent
}
stream.on(EventType.OrderCompleted, async (e) => {
  if (isMyOutboundOrder(e.order_id!)) collect(e.order_id!, await client.getDelivery(e.order_id!));
});
```

Deliver to the user:
```ts
await client.deliverOrder(userOrderId, {
  deliverableType: DeliverableType.Schema,
  deliverableText: JSON.stringify(synthesizedResult),
});
```

Our own services (registered in the Dashboard, Day 1): `daily_brief` (requirements: watchlist), `vet_token` (requirements: {address, chain}), `vet_and_execute`. Deliverable: Schema. Set Capo's SLA comfortably above the worst-case roster SLA + synthesis time.

## 7. Synthesis & honesty (no hallucination, by design)

Capo's output value is the synthesis, but synthesis must not invent. Rules baked into the product:
- The LLM only summarizes/cross-references **what the sub-agents actually returned**. Every claim in the brief/verdict is attributed to its source sub-agent and the raw sub-deliverable is attached.
- The verdict is **rule-based first** (e.g. ChainGuard flags a critical vuln → cap verdict at "caution"; VeriClaw says scam → "scam"), with the LLM writing the human-readable explanation around the deterministic flags — not deciding safety on vibes.
- If a sub-agent times out or returns garbage, the output says so explicitly and lowers confidence; it never fabricates a missing source.
- This keeps us clear of the "fake demo / hallucinated output" disqualification and is genuinely better UX.

## 8. Failure handling (production-grade, because orders = money)

- **Partial delivery:** if N-1 of N sub-agents succeed, deliver the brief with the missing section flagged + a small fee rebate note. Never fail a whole run because one provider was slow.
- **Sub-agent SLA timeout:** CROO auto-refunds Capo's escrow for that sub-order; Capo proceeds with partials and accounts for the refund.
- **Capo SLA risk:** global run deadline must sit inside Capo's own SLA so Capo always delivers (even partials) before its own timeout, avoiding refunding the user when it actually did work.
- **Idempotency:** all SDK ops are idempotency-safe; key every external action by (userOrderId, role) so retries don't double-pay.
- **Insufficient float:** detect `isInsufficientBalance`, top up alert, queue the run.

## 9. Monetization & unit economics (owner mindset)

- **Pricing model for the hackathon: per-call** (each use = one order → maximizes the order-count metric + the 10+ bonus + buyer-wallet diversity). Subscriptions/prepaid USDC allowance = v2 (research shows crypto users rarely renew fat subs; keep any sub thin).
- **Indicative costs & prices** (gas is sponsored / 0% in the launch window, so COGS ≈ sub-hire USDC + CROO platform fee):
  - Daily Brief: sub-cost ≈ $0.50 → price **$0.99**.
  - Vet Token: sub-cost ≈ $0.33 → price **$0.79**.
  - Execute: adds SwapGod $0.10 + the swap itself (user's funds).
- **⚠️ Unknown to confirm:** the CROO **platform fee %** taken on settlement (docs say "platform fee to Treasury, remainder to Provider" but don't state the rate). Margins above assume it's small; verify before finalizing price. Do not invent a number.
- **Margin logic:** Capo earns the spread between its bundle price and roster cost, and the value is *real* (one synthesized answer vs 5 manual calls). This is a genuine business, not a loss-leader.

## 10. Go-to-market — how we hit the metrics *honestly*

Targets: 10+ real CAP orders (bonus), ≥3 unique counterparty agents, ≥5 unique buyer wallets, **no concentrated self-trade**.

- **Counterparty diversity is automatic.** Every Capo run hires 4-6 *different* roster agents → ≥3 counterparties cleared on the first real run, and order volume accrues every time anyone uses Capo. This is the cleanest part.
- **Buyer-wallet diversity (the real work):**
  1. **Recruit other hackathon teams (symbiotic).** Every team needs A2A relationships for their own composability score. Offer: "call Capo for a free/cheap brief, and Capo can call your agent." Both submissions benefit → easy yes. Target 5-10 teams in the CROO Discord / office hours.
  2. **Real crypto users via the Console.** Connect-wallet → free first brief → small fee after. Share in a few trader communities. Aim for genuine repeat use.
  3. **Other agents subscribing.** A trading-bot agent can call Daily Brief every morning (real recurring A2A).
- **Anti-sybil discipline:** do NOT wash-trade between our own wallets. Diversity must come from real teams + real users. Document the order graph for the appeals window just in case.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Execution custody (Loop C)** — routing a real swap with user funds through an agent chain is the riskiest part | v1: make Execute optional; start with **tiny real swaps** or return a ready-to-sign route the user signs in their own wallet. Don't custody user funds in Capo. Treat full delegated execution as v1.5. |
| Sub-agent returns junk / is down | per-role fallback agent; partial delivery; rule-based verdict floor; downgrade confidence |
| Sub-agent SLA slower than Capo SLA | global run deadline inside Capo SLA; set Capo SLA generously; partials |
| `payOrder` nonce collisions | strict sequential pay queue (already designed) |
| Platform fee unknown → margin wrong | confirm fee before pricing; price has headroom |
| Roster agents are themselves wash-traded / low quality | we verify each roster agent's output quality during Day-1 setup; only ship roles whose outputs are real and useful |
| Whole store is crypto → limited TAM | acceptable: CROO's users *are* crypto; this is the right audience for "real users day one" |
| Self-trade flags | strict no-wash policy; recruit real external buyers |

## 12. Judging-criteria scorecard (how each feature earns points)

| Criterion | Weight | How Capo scores |
|---|---|---|
| Technical Execution | 30% | Real CAP integration both roles; escrow per sub-hire; sequential-pay correctness; partial-failure handling; aim 10+ real orders (bonus) |
| A2A Composability | 25% | 4-6 diverse counterparties **per run**, real recurring order flow; among the only true orchestrators with non-zero orders |
| Innovation | 20% | Trustless composition + on-chain execution in one flow; impossible on a normal API marketplace |
| Usability & Adoption | 15% | Console + daily-brief habit; symbiotic team recruiting; real crypto-user value |
| Presentation | 10% | Live demo: orders fire in the store feed in real time, swap settles on Base on camera; crisp value prop |

## 13. Scope: v1 (hackathon) vs later

- **v1 (ship):** Capo agent (provider+requester), curated roster manifest with fallbacks, fan-out engine with sequential pay, Loop A (Daily Brief) + Loop B (Vet Token), rule-based+LLM synthesis with source attribution, Capo Console (wallet connect, watchlist, trigger, live order view), per-call pricing. Loop C = **optional**, tiny real swap or sign-it-yourself route.
- **v1.5:** delegated/auto execution with proper custody design; scheduled daily push (auto-pay subscription).
- **v2:** dynamic roster selection by price/quality, thin subscription / prepaid allowance, more verticals (DeFi portfolio/liquidation health as a third loop), Telegram bot, reputation-weighted routing once CROO exposes it.

## 14. Build plan (day-by-day)

Assumes a short hackathon sprint; compress/expand to fit the actual timeline.

- **Day 1 — Setup & recon.** Register Capo agent on the Dashboard (wallet, DID, SDK key). Fund AA wallet with USDC float. Capture each roster agent's `serviceId` + `requirements` schema from its store page; verify each returns real output by hiring it once manually. Build the roster manifest. Hello-world: hire ONE agent end-to-end (negotiate→pay→getDelivery).
- **Day 2 — Fan-out engine.** Single client + WS, dual-role routing, parallel negotiate, **sequential pay queue**, collection with timeouts, run-state persistence, partial-result handling. Prove: one trigger hires 3 agents and returns all results.
- **Day 3 — Loops + synthesis.** Implement Loop A and Loop B; rule-based verdict floor + LLM synthesis with source attribution. Register Capo's own services. Prove: a real user order → Capo fans out → delivers a synthesized brief/verdict via CAP.
- **Day 4 — Console + execution.** Next.js console (connect wallet, watchlist, trigger, live order feed). Loop C as optional tiny/real or sign-yourself. Polish output formatting.
- **Day 5 — GTM + orders.** Recruit teams + users; drive 10+ real orders across ≥5 wallets; capture the order graph. Harden retries/edge cases.
- **Day 6 — Demo + README.** Record ≤5-min demo (store feed firing live + swap on Base). README: setup, SDK methods used, integration notes, license (MIT). File BUIDL on DoraHacks.

## 15. Open decisions (need input)

1. **Name** — keep "Capo" or pick another?
2. **Loop C scope** — tiny real swap, or "we return the route, you sign" for v1? (Recommend the latter to avoid custody risk.)
3. **Console** — build the web console in v1 (better demo/retention) or rely on store/Navigator + a Telegram reminder?
4. **Synthesis model** — Opus for quality vs Haiku for cost/speed per call (affects COGS).

---

*Sources of truth for this doc: CROO docs (docs.croo.network), the real @croo-network/node-sdk repo, and a 2026-06-25 live inventory of agent.croo.network. Any number marked ⚠️ is unconfirmed and must be verified before relying on it.*
