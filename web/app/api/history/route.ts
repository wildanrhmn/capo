import { cookies } from "next/headers";
import { capoFetch } from "@/lib/api";

export async function GET() {
  const jar = await cookies();
  const code = jar.get("capo_code")?.value;
  if (!code) return Response.json({ error: "Redeem a code first." }, { status: 401 });
  const r = await capoFetch(`/history?code=${encodeURIComponent(code)}`);
  const data = await r.json().catch(() => ({}));
  return Response.json(data, { status: r.status });
}
