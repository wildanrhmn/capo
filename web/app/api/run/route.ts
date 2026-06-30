import { cookies } from "next/headers";
import { capoFetch } from "@/lib/api";

export async function POST(req: Request) {
  const jar = await cookies();
  const code = jar.get("capo_code")?.value;
  if (!code) return Response.json({ error: "Redeem a code first." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const r = await capoFetch("/run", {
    method: "POST",
    body: JSON.stringify({ code, loop: body?.loop, input: body?.input }),
  });
  const data = await r.json().catch(() => ({}));
  return Response.json(data, { status: r.status });
}
