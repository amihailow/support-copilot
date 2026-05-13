-- Support Copilot: Postgres schema with pgvector
-- Run on Supabase or local Postgres

create extension if not exists vector;
create extension if not exists pg_trgm;

create table if not exists kb_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references kb_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now()
);

create index if not exists kb_chunks_embedding_idx
  on kb_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists kb_chunks_fts_idx
  on kb_chunks using gin (fts);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text not null,
  subject text not null,
  body text not null,
  status text not null default 'open',
  category text,
  priority text,
  sentiment text,
  created_at timestamptz not null default now()
);

create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  draft text not null,
  confidence numeric not null,
  citation_ids uuid[] not null default '{}',
  model text not null,
  latency_ms int not null,
  cost_usd numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references suggestions(id) on delete cascade,
  action text not null check (action in ('sent_as_is','edited_then_sent','rejected','escalated')),
  final_text text,
  agent_id text not null,
  created_at timestamptz not null default now()
);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 20
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  document_url text,
  content text,
  chunk_index int,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.document_id,
    d.title as document_title,
    d.url as document_url,
    c.content,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity
  from kb_chunks c
  join kb_documents d on d.id = c.document_id
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

create or replace function search_chunks_bm25(
  query_text text,
  match_count int default 20
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  document_url text,
  content text,
  chunk_index int,
  rank float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.document_id,
    d.title as document_title,
    d.url as document_url,
    c.content,
    c.chunk_index,
    ts_rank_cd(c.fts, websearch_to_tsquery('english', query_text)) as rank
  from kb_chunks c
  join kb_documents d on d.id = c.document_id
  where c.fts @@ websearch_to_tsquery('english', query_text)
  order by rank desc
  limit match_count;
end;
$$;
