import "dotenv/config";
import { resolveRoster, rosterForLoop } from "../src/roster";

const usd = (base: string): string => `$${(Number(base) / 1e6).toFixed(2)}`;

const resolution = await resolveRoster();
const { resolved, problems } = resolution;

console.log(`\nResolved ${resolved.length}/8 roster agents from the live CROO public API:\n`);
for (const r of resolved) {
  const reqs = r.requirements.map((f) => `${f.name}${f.required ? "" : "?"}:${f.type}`).join(", ") || "(none)";
  const flag = r.online ? "online" : "OFFLINE";
  console.log(`- ${r.role.padEnd(15)} ${r.agentName}  [${flag}]`);
  console.log(`    service "${r.serviceDisplayName}"  id=${r.serviceId}`);
  console.log(`    price=${usd(r.price)}  sla=${r.slaMinutes}m  deliver=${r.deliverableType}`);
  console.log(`    inputs: ${reqs}`);
}

const sum = (entries: { price: string }[]): string => String(entries.reduce((s, e) => s + Number(e.price), 0));
console.log(`\nLeg-2 sub-hire cost per run:`);
console.log(`  Daily Brief: ${usd(sum(rosterForLoop(resolution, "brief")))}`);
console.log(`  Vet Token:   ${usd(sum(rosterForLoop(resolution, "vet")))}`);

if (problems.length > 0) {
  console.log(`\nProblems:`);
  for (const p of problems) console.log(`  ! ${p}`);
} else {
  console.log(`\nAll roster agents resolved and online.`);
}
