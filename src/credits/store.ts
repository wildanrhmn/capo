import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

export function genCode(): string {
  const seg = () => randomBytes(2).toString("hex").toUpperCase();
  return `CAPO-${seg()}${seg()}-${seg()}${seg()}`;
}

export function genRunId(): string {
  return randomBytes(6).toString("hex");
}

export interface CreditRun {
  id: string;
  loop: "brief" | "vet";
  input: unknown;
  markdown: string;
  sourcesOk: number;
  sourcesTotal: number;
  verdict?: string;
  confidence: string;
  createdAt: string;
}

export interface CreditCode {
  code: string;
  credits: number;
  used: number;
  buyerUserId?: string;
  createdAt: string;
  runs: CreditRun[];
}

interface Db {
  codes: Record<string, CreditCode>;
}

export class CreditStore {
  private db: Db;

  constructor(private readonly path: string) {
    if (existsSync(path)) {
      this.db = JSON.parse(readFileSync(path, "utf8")) as Db;
    } else {
      this.db = { codes: {} };
      this.flush();
    }
  }

  private flush(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.db, null, 2));
  }

  issue(credits: number, buyerUserId?: string): CreditCode {
    const code = genCode();
    const rec: CreditCode = { code, credits, used: 0, buyerUserId, createdAt: new Date().toISOString(), runs: [] };
    this.db.codes[code] = rec;
    this.flush();
    return rec;
  }

  get(code: string): CreditCode | undefined {
    return this.db.codes[code];
  }

  remaining(code: string): number {
    const c = this.get(code);
    return c ? Math.max(0, c.credits - c.used) : 0;
  }

  consume(code: string): boolean {
    const c = this.get(code);
    if (!c || c.used >= c.credits) return false;
    c.used += 1;
    this.flush();
    return true;
  }

  addRun(code: string, run: CreditRun): void {
    const c = this.get(code);
    if (!c) return;
    c.runs.unshift(run);
    if (c.runs.length > 50) c.runs.length = 50;
    this.flush();
  }
}
