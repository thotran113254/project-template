import { queryClient } from "./connection";
import { sql } from "drizzle-orm";
import { db } from "./connection";

async function reset() {
  console.log("Resetting database...");

  await db.execute(sql`DROP TABLE IF EXISTS resources CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);

  console.log("  Dropped all tables");
  console.log("Reset completed! Run db:push then db:seed to recreate.");

  await queryClient.end();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
