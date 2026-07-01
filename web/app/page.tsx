import { getCapoStats, ROSTER } from "@/lib/croo";
import { Landing } from "@/components/landing";

export const revalidate = 30;

export default async function Home() {
  const stats = await getCapoStats();
  return <Landing stats={stats} crew={ROSTER} />;
}
