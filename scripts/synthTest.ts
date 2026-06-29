import "dotenv/config";
import { synthesize } from "../src/synth/synthesize";
import type { SubResult } from "../src/engine/orchestrator";
import type { BriefInput } from "../src/engine/requirements";

const results: SubResult[] = [
  {
    role: "smartMoney",
    agentName: "AlphaTrack",
    serviceId: "alphatrack",
    status: "completed",
    deliverableType: "text",
    deliverableText:
      "1: 交易员 SMXKX 当前管理资产 14,700,655 累计盈利 946,012 (ROI: 6.03%). 2: 币老大888 管理 3,414,150 盈利 309,204 (ROI 9.96%). 3: 予与m 管理 4,423,462 盈利 128,069 (ROI 2.89%). 8: 남석희 (GodSeoky) 管理 45,307 盈利 37,631 (ROI 150.47%).",
    costPaid: "100000",
  },
  {
    role: "whalePositions",
    agentName: "WhaleScope",
    serviceId: "whalescope",
    status: "completed",
    deliverableType: "schema",
    deliverableText: '{"data": null, "error": "missing_wallet_field", "request": {"wallet": ""}, "service": "whalescope-wallet-positions"}',
    costPaid: "100000",
  },
  {
    role: "events",
    agentName: "Polymind",
    serviceId: "polymind",
    status: "completed",
    deliverableType: "schema",
    deliverableText:
      '{"events":[{"category":"Sports","title":"World Cup Winner","volume_24h":60378436},{"category":"Politics","title":"Next Prime Minister of Ethiopia?","volume_24h":13803669},{"category":"Sports","title":"Brazil vs. Japan","volume_24h":4319209}]}',
    costPaid: "100000",
  },
  {
    role: "prices",
    agentName: "SwapCat",
    serviceId: "swapcat",
    status: "failed",
    error: "no order created (provider did not accept)",
    costPaid: "0",
  },
  {
    role: "marketMood",
    agentName: "DCA Signal AI Agent",
    serviceId: "dca",
    status: "completed",
    deliverableType: "schema",
    deliverableText:
      '{"asset":"BTC","value":12,"classification":"extreme_fear","interpretation":"市场恐慌时，往往是定投的好时机"}',
    costPaid: "100000",
  },
];

const input: BriefInput = { watchlistTokens: ["ETH", "AERO"], watchlistWallets: [], chain: "base" };

const out = await synthesize("brief", input, results);
console.log(`synth model: ${out.model} · confidence: ${out.confidence}\n`);
console.log(out.markdown);
process.exit(0);
