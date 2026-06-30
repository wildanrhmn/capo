import express from "express";
import type { Request, Response, NextFunction } from "express";
import type { CrooGateway } from "./croo/gateway";
import type { RosterResolution } from "./roster";
import { rosterForLoop } from "./roster";
import type { PayQueue } from "./engine/payQueue";
import { runLoop } from "./loops";
import { parseInput } from "./inputs";
import type { CreditStore, CreditRun } from "./credits/store";
import { genRunId } from "./credits/store";
import { prepareSwap } from "./execute/prepare";

export interface ApiDeps {
  gateway: CrooGateway;
  resolution: RosterResolution;
  payQueue: PayQueue;
  store: CreditStore;
  port: number;
  secret?: string;
  siteOrigin?: string;
  storeBase?: string;
  log?: (msg: string) => void;
}

export function startApi(deps: ApiDeps): void {
  const log = deps.log ?? (() => {});
  const app = express();
  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", deps.siteOrigin ?? "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type, x-capo-api-secret");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    if (deps.secret && req.headers["x-capo-api-secret"] !== deps.secret) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, roster: deps.resolution.resolved.filter((r) => r.online).length });
  });

  app.post("/redeem", (req: Request, res: Response) => {
    const code = String(req.body?.code ?? "").trim().toUpperCase();
    const rec = deps.store.get(code);
    if (!rec) {
      res.status(404).json({ error: "Invalid code" });
      return;
    }
    res.json({ code: rec.code, credits: rec.credits, used: rec.used, remaining: deps.store.remaining(code) });
  });

  app.get("/history", (req: Request, res: Response) => {
    const code = String(req.query.code ?? "").trim().toUpperCase();
    const rec = deps.store.get(code);
    if (!rec) {
      res.status(404).json({ error: "Invalid code" });
      return;
    }
    res.json({ remaining: deps.store.remaining(code), runs: rec.runs });
  });

  app.post("/run", async (req: Request, res: Response) => {
    try {
      const code = String(req.body?.code ?? "").trim().toUpperCase();
      const loop = req.body?.loop === "vet" ? "vet" : "brief";
      const rec = deps.store.get(code);
      if (!rec) {
        res.status(404).json({ error: "Invalid code" });
        return;
      }
      if (deps.store.remaining(code) <= 0) {
        res.status(402).json({ error: "No credits remaining" });
        return;
      }

      const input = parseInput(loop, req.body?.input ?? {});
      const entries = rosterForLoop(deps.resolution, loop);
      const out = await runLoop(deps.gateway, loop, entries, input, deps.payQueue, { deadlineMs: 180_000, log });
      const ok = out.results.filter((r) => r.status === "completed").length;

      if (ok === 0) {
        res.status(503).json({ error: "The crew didn't respond this time — you weren't charged. Try again in a moment." });
        return;
      }

      deps.store.consume(code);
      const run: CreditRun = {
        id: genRunId(),
        loop,
        input,
        markdown: out.synthesis.markdown,
        sourcesOk: ok,
        sourcesTotal: out.results.length,
        verdict: out.synthesis.verdict,
        confidence: out.synthesis.confidence,
        createdAt: new Date().toISOString(),
      };
      deps.store.addRun(code, run);
      res.json({ run, remaining: deps.store.remaining(code) });
    } catch (err) {
      log(`/run error: ${(err as Error).message}`);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/execute/prepare", (req: Request, res: Response) => {
    const code = String(req.body?.code ?? "").trim().toUpperCase();
    if (!deps.store.get(code)) {
      res.status(404).json({ error: "Invalid code" });
      return;
    }
    const prepared = prepareSwap(
      {
        token: String(req.body?.token ?? ""),
        amountUsd: Number(req.body?.amountUsd ?? 0),
        recipient: String(req.body?.recipient ?? ""),
        slippageBps: req.body?.slippageBps != null ? Number(req.body.slippageBps) : undefined,
      },
      deps.storeBase ?? "https://agent.croo.network",
    );
    res.status(prepared.ok ? 200 : 400).json(prepared);
  });

  app.listen(deps.port, () => log(`api listening on :${deps.port}`));
}
