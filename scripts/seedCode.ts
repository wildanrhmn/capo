import "dotenv/config";
import { CreditStore } from "../src/credits/store";

const store = new CreditStore(process.env.CAPO_CREDITS_DB ?? "data/credits.json");
const credits = Number(process.argv[2] ?? 10);
const rec = store.issue(credits);
console.log(rec.code);
