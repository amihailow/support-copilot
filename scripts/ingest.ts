import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/db";
import { chunkText, embed } from "@/lib/embeddings";

const KB_DIR = path.resolve(process.cwd(), "data/sample-kb");

interface DocFile {
  filePath: string;
  title: string;
  source: string;
  content: string;
}

function listDocs(): DocFile[] {
  if (!fs.existsSync(KB_DIR)) {
    console.error(`KB directory not found: ${KB_DIR}`);
    return [];
  }

  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const full = path.join(KB_DIR, f);
      const content = fs.readFileSync(full, "utf8");
      const firstHeading = content.split("\n").find((l) => l.startsWith("# "));
      const title = firstHeading
        ? firstHeading.replace(/^#\s+/, "").trim()
        : f.replace(/\.md$/, "");
      return {
        filePath: full,
        title,
        source: `sample-kb/${f}`,
        content,
      };
    });
}

async function ingestDoc(db: ReturnType<typeof getSupabaseAdmin>, doc: DocFile) {
  console.log(`\n[ingest] ${doc.source}`);

  const { data: existing } = await db
    .from("kb_documents")
    .select("id")
    .eq("source", doc.source)
    .maybeSingle();

  let documentId: string;
  if (existing) {
    documentId = existing.id;
    await db.from("kb_chunks").delete().eq("document_id", documentId);
    console.log("  cleared previous chunks");
  } else {
    const { data, error } = await db
      .from("kb_documents")
      .insert({ title: doc.title, source: doc.source })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to insert document: ${error?.message}`);
    }
    documentId = data.id;
  }

  const chunks = chunkText(doc.content);
  console.log(`  chunked into ${chunks.length} pieces`);

  const embeddings = await embed(chunks);
  console.log(`  embedded ${embeddings.length} vectors`);

  const rows = chunks.map((content, i) => ({
    document_id: documentId,
    chunk_index: i,
    content,
    embedding: embeddings[i],
  }));

  const { error: insertError } = await db.from("kb_chunks").insert(rows);
  if (insertError) {
    throw new Error(`Failed to insert chunks: ${insertError.message}`);
  }

  console.log(`  stored`);
}

async function main() {
  const docs = listDocs();
  if (docs.length === 0) {
    console.error("No KB documents found. Add markdown files under data/sample-kb/.");
    process.exit(1);
  }

  console.log(`Ingesting ${docs.length} document(s) into Supabase...`);

  const db = getSupabaseAdmin();

  for (const doc of docs) {
    await ingestDoc(db, doc);
  }

  console.log("\nIngestion complete.");
}

main().catch((e) => {
  console.error("\nIngest failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
