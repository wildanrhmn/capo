import type { SubResult } from "../engine/orchestrator";
import type { JobInput, BriefInput, VetInput } from "../engine/requirements";

export type LoopName = "brief" | "vet";
export type Verdict = "safe" | "caution" | "scam" | "unknown";

export interface SynthSource {
  agent: string;
  role: string;
  ok: boolean;
}

export interface Synthesis {
  markdown: string;
  confidence: "high" | "medium" | "low";
  verdict?: Verdict;
  sources: SynthSource[];
  model: string;
}

function bodyOf(r: SubResult): string {
  if (r.status !== "completed") return `FAILED (${r.error ?? "unknown"})`;
  return r.deliverableText || r.deliverableSchema || "(empty)";
}

function ruleVerdict(results: SubResult[]): Verdict {
  const considered = results.filter((r) => (r.role === "contractAudit" || r.role === "walletRisk") && r.status === "completed");
  if (considered.length === 0) return "unknown";
  const text = considered.map(bodyOf).join(" ").toLowerCase();
  if (/\b(scam|honeypot|malicious|critical|rug|blacklist)\b/.test(text)) return "scam";
  if (/\b(caution|warning|medium risk|high risk|suspicious|unverified|proxy|mintable)\b/.test(text)) return "caution";
  return "safe";
}

function confidenceOf(results: SubResult[]): "high" | "medium" | "low" {
  if (results.length === 0) return "low";
  const ok = results.filter((r) => r.status === "completed").length;
  const ratio = ok / results.length;
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

function fallbackMarkdown(loop: LoopName, input: JobInput, results: SubResult[], verdict?: Verdict): string {
  const lines: string[] = [];
  if (loop === "brief") {
    const i = input as BriefInput;
    lines.push(`# Capo Daily Brief`);
    lines.push(`Watchlist: ${i.watchlistTokens.join(", ") || "(none)"} · chain: ${i.chain}`);
  } else {
    const i = input as VetInput;
    lines.push(`# Capo Token Verdict — ${i.token}`);
    lines.push(`**Verdict: ${(verdict ?? "unknown").toUpperCase()}** (rule-based)`);
  }
  lines.push("");
  for (const r of results) {
    lines.push(`## ${r.agentName} — ${r.role}`);
    lines.push(r.status === "completed" ? "```\n" + bodyOf(r) + "\n```" : `_unavailable — ${r.error ?? "failed"}_`);
    lines.push("");
  }
  const ok = results.filter((r) => r.status === "completed").length;
  lines.push(`_${ok}/${results.length} sources delivered._`);
  return lines.join("\n");
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: string; text: string } => typeof b === "object" && b !== null && (b as { type?: string }).type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export async function synthesize(loop: LoopName, input: JobInput, results: SubResult[]): Promise<Synthesis> {
  const confidence = confidenceOf(results);
  const verdict = loop === "vet" ? ruleVerdict(results) : undefined;
  const sources: SynthSource[] = results.map((r) => ({ agent: r.agentName, role: r.role, ok: r.status === "completed" }));
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CAPO_SYNTH_MODEL ?? "claude-haiku-4-5";

  if (!apiKey) {
    return { markdown: fallbackMarkdown(loop, input, results, verdict), confidence, verdict, sources, model: "fallback" };
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const context = results.map((r) => `### ${r.agentName} [${r.role}]\n${bodyOf(r)}`).join("\n\n");
    const system =
      `You are Capo, an on-chain crypto copilot. Summarize ONLY the data the sub-agents below returned. ` +
      `Attribute every claim to its source agent by name. Never invent numbers, addresses, or facts not present in the data. ` +
      `If a source FAILED, say so plainly and treat its information as missing. ` +
      (loop === "vet"
        ? `A rule-based safety verdict has already been computed: "${verdict}". Explain it from the audit/risk data; do NOT make it more favorable than the rule-based verdict.`
        : `Produce a crisp morning brief: what smart money did, notable moves, and what to watch.`);
    const prompt = `User request (${loop}): ${JSON.stringify(input)}\n\nSub-agent results:\n\n${context}\n\nWrite the ${loop === "brief" ? "daily brief" : "token verdict"} in concise markdown.`;
    const msg = await client.messages.create({
      model,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const text = extractText(msg.content);
    if (!text) return { markdown: fallbackMarkdown(loop, input, results, verdict), confidence, verdict, sources, model: "fallback" };
    return { markdown: text, confidence, verdict, sources, model };
  } catch (err) {
    const note = `\n\n_(synthesis fell back to deterministic mode: ${(err as Error).message})_`;
    return { markdown: fallbackMarkdown(loop, input, results, verdict) + note, confidence, verdict, sources, model: "fallback" };
  }
}
