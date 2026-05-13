# Setup

Two paths: run the UI immediately in mock mode (no keys), or wire the live pipeline (free tiers, ~10 minutes).

## Path 1: mock mode (zero setup)

```bash
git clone https://github.com/amihailow/support-copilot.git
cd support-copilot
npm install
npm run dev
```

Open `http://localhost:3000`. The pipeline page works against the in-process seed cache. Useful for demo, screenshots, and UI work. No external services touched.

## Path 2: live pipeline

You need API keys from four services. All have free tiers that cover demo traffic.

### 1. Anthropic Claude

Classification and response generation.

1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Sign up - new accounts get $5 free credits.
3. Create an API key.
4. Save it as `ANTHROPIC_API_KEY`.

### 2. OpenAI

Embeddings via `text-embedding-3-small`.

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Sign up - new accounts get $5 free credits.
3. Create an API key.
4. Save it as `OPENAI_API_KEY`.

### 3. Cohere

Reranker `rerank-3.5`.

1. Go to [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys).
2. Sign up - free trial key, 1000 reranks/month is enough for demo.
3. Save the trial key as `COHERE_API_KEY`.

### 4. Supabase

Postgres + pgvector + full-text search.

1. Go to [supabase.com](https://supabase.com) - create a new project.
2. Project Settings > API:
   - Copy `URL` -> `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy `anon public` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy `service_role secret` (hidden by default) -> `SUPABASE_SERVICE_ROLE_KEY`.
3. SQL Editor > New query:
   - Open `supabase/schema.sql` from this repo.
   - Paste and run.

### 5. Langfuse (optional but recommended)

Observability for every classify/retrieve/generate span.

1. Go to [cloud.langfuse.com](https://cloud.langfuse.com).
2. Create a project, grab Public + Secret keys.
3. Save as `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST=https://cloud.langfuse.com`.

### Wire it all up

```bash
cp .env.example .env.local
# edit .env.local and fill in the keys

npm run check-env       # validates all required keys are set
npm run ingest          # loads sample-kb/*.md into Supabase + embeddings
npm run seed            # loads sample-tickets.json into Supabase
npm run dev
```

The app auto-detects keys and runs the live pipeline against Anthropic / OpenAI / Cohere / Supabase. You'll see `mode: live` in the pipeline runner instead of `mode: mock`.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Vercel auto-detects Next.js.
3. In the project's `Settings > Environment Variables`, paste the same keys from your `.env.local` (Anthropic / OpenAI / Cohere / Supabase / Langfuse). Mark Langfuse keys as optional.
4. Trigger a deploy. The first build runs `next build` and serves all static pages plus the API routes.
5. The CI workflow (`.github/workflows/ci.yml`) runs on every PR before merge: typecheck, vitest, eval suite (`MOCK_MODE=true`), and a production build. A failing eval blocks the merge.

If you skip the live keys on Vercel, the deployment still works fully - it stays in mock mode and serves the cached pipeline output.

## Costs (free tier estimates)

For demo traffic (10-50 tickets/day):

| Service | Free tier | Demo cost |
| --- | --- | --- |
| Anthropic | $5 free credits | ~$0.50/100 tickets |
| OpenAI embeddings | $5 free credits | ~$0.01/100 chunks |
| Cohere rerank | 1000/month free | $0 |
| Supabase | 500MB free | $0 |
| Langfuse | 50k traces/month free | $0 |

Two cents per ticket end-to-end is the steady-state target after free credits.

## Troubleshooting

`npm run ingest` fails with `Supabase admin env vars are missing`
- Run `npm run check-env` first - it tells you exactly which key is missing.

Vector search returns no results
- Did `npm run ingest` succeed? Check Supabase table editor - `kb_chunks` should have rows.
- Did the schema include the `match_chunks` and `search_chunks_bm25` functions? Re-run `supabase/schema.sql` if unsure.

`rerank-3.5: model not found`
- Cohere occasionally renames models. Update `MODELS.reranker` in `src/lib/llm.ts`.

API returns `mode: mock` even though I set the keys
- Restart `npm run dev` after editing `.env.local`. Next.js does not hot-reload env files.
