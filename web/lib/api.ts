import "server-only";

const API = process.env.CAPO_API_URL ?? "http://localhost:8790";
const SECRET = process.env.CAPO_API_SECRET ?? "";

export async function capoFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-capo-api-secret": SECRET, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
}
