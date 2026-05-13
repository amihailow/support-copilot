import "dotenv/config";

const REQUIRED = {
  ANTHROPIC_API_KEY: {
    why: "Used for ticket classification and response generation",
    hint: "Get one at https://console.anthropic.com/settings/keys",
  },
  OPENAI_API_KEY: {
    why: "Used for embeddings (text-embedding-3-small)",
    hint: "Get one at https://platform.openai.com/api-keys",
  },
  COHERE_API_KEY: {
    why: "Used for reranking retrieved KB chunks (rerank-3.5)",
    hint: "Get one at https://dashboard.cohere.com/api-keys (free tier covers demo)",
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    why: "Supabase project URL",
    hint: "Create a project at https://supabase.com, find URL in Settings > API",
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    why: "Supabase anon (public) key",
    hint: "Settings > API > anon public",
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    why: "Supabase service role key (server-side ingestion / RPC)",
    hint: "Settings > API > service_role secret",
  },
} as const;

const OPTIONAL = {
  LANGFUSE_PUBLIC_KEY: "Observability traces",
  LANGFUSE_SECRET_KEY: "Observability traces",
  LANGFUSE_HOST: "Observability backend URL (cloud.langfuse.com by default)",
} as const;

function main() {
  console.log("Support Copilot - environment check\n");

  const missing: string[] = [];
  const present: string[] = [];

  for (const [key, info] of Object.entries(REQUIRED)) {
    if (process.env[key]) {
      present.push(key);
      console.log(`  [ok]      ${key}`);
    } else {
      missing.push(key);
      console.log(`  [missing] ${key}`);
      console.log(`            ${info.why}`);
      console.log(`            ${info.hint}`);
    }
  }

  console.log("");
  for (const [key, why] of Object.entries(OPTIONAL)) {
    if (process.env[key]) {
      console.log(`  [ok]      ${key} (optional - ${why})`);
    } else {
      console.log(`  [skip]    ${key} (optional - ${why})`);
    }
  }

  console.log("");
  if (missing.length === 0) {
    console.log("All required keys are set. You can run:");
    console.log("  npm run db:migrate    apply Postgres schema");
    console.log("  npm run ingest        load the sample knowledge base");
    console.log("  npm run seed          load the sample tickets");
    console.log("  npm run dev           start the app in live mode");
    process.exit(0);
  }

  console.log(
    `Missing ${missing.length}/${Object.keys(REQUIRED).length} required keys.`,
  );
  console.log("Copy .env.example to .env.local and fill in the values above.");
  console.log(
    "The app will still run in mock mode without keys, but the live pipeline will not.",
  );
  process.exit(1);
}

main();
