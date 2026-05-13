import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/db";

interface RawTicket {
  customerName: string;
  customerEmail: string;
  subject: string;
  body: string;
}

const FILE = path.resolve(process.cwd(), "data/sample-tickets.json");

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`File not found: ${FILE}`);
    process.exit(1);
  }

  const raw: RawTicket[] = JSON.parse(fs.readFileSync(FILE, "utf8"));
  console.log(`Seeding ${raw.length} ticket(s) into Supabase...`);

  const db = getSupabaseAdmin();

  for (const t of raw) {
    const { error } = await db.from("tickets").insert({
      customer_name: t.customerName,
      customer_email: t.customerEmail,
      subject: t.subject,
      body: t.body,
      status: "open",
    });

    if (error) {
      console.error(`  failed: ${t.subject} -> ${error.message}`);
    } else {
      console.log(`  ok: ${t.subject}`);
    }
  }

  console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error("\nSeed failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
