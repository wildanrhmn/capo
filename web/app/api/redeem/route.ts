import { cookies } from "next/headers";
import { capoFetch } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim().toUpperCase();
  const r = await capoFetch("/redeem", { method: "POST", body: JSON.stringify({ code }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return Response.json({ error: data?.error ?? "Invalid code" }, { status: r.status });
  const jar = await cookies();
  jar.set("capo_code", code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return Response.json(data);
}
