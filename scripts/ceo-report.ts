import "./load-env";
import { prisma } from "../src/lib/db";
import { generateCeoReport } from "../src/lib/ceo/report";

/** CLI: npm run ceo:report [-- WEEKLY] */
async function main() {
  const period = process.argv.includes("WEEKLY") ? "WEEKLY" : "DAILY";
  const r = await generateCeoReport(period);
  console.log(`report ${r.id}\n\n${r.summary}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
