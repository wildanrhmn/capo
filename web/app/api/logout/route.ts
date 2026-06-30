import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.delete("capo_code");
  return Response.json({ ok: true });
}
