# RAG AI Integration - Backend PH Healthcare

## 1. Goal
Implement a simple but industry-standard Retrieval-Augmented Generation (RAG) feature in the existing backend using only free services and modern versions.

## 2. Free Stack Used
- Generation LLM: Groq API (OpenAI-compatible endpoint)
- Embedding Model Host: Hugging Face Inference API
- Vector Store: PostgreSQL + pgvector extension
- Backend Runtime: Existing Express + Prisma architecture

## 3. What Was Added

### 3.1 Database Migration
Prisma schema file added:
- prisma/schema/rag.prisma

Prisma-generated migration:
- prisma/migrations/20260326120000_rag_document_embeddings/migration.sql

Prisma cannot manage extension enablement and advanced pgvector index operator classes directly in schema, so those are separated into dedicated SQL scripts (not hand-edited migration files):
- prisma/sql/01_enable_pgvector.sql
- prisma/sql/02_rag_vector_indexes.sql

This setup does:
- Creates document_embeddings table from Prisma schema
- Creates unique chunkKey for idempotent upsert
- Adds standard Prisma-managed indexes
- Adds optional advanced vector index via dedicated SQL script

### 3.2 New RAG Module
Created module directory:
- src/app/module/rag/

Files:
- rag.constant.ts
- rag.interface.ts
- rag.validation.ts
- rag.utils.ts
- embedding.service.ts
- llm.service.ts
- indexing.service.ts
- rag.service.ts
- rag.controller.ts
- rag.route.ts

### 3.3 Route Wiring
Updated:
- src/app/routes/index.ts

Added route mount:
- /api/v1/rag

### 3.4 Environment Configuration
Updated:
- src/app/config/env.ts

Added optional RAG config object with:
- GROQ_API_KEY
- HF_API_KEY
- RAG_GROQ_MODEL
- RAG_EMBEDDING_MODEL
- RAG_CHUNK_SIZE
- RAG_CHUNK_OVERLAP
- RAG_DOC_DIRS

## 4. Why This Design

### 4.1 Why pgvector in PostgreSQL
- Keeps vector storage close to existing Prisma/Postgres setup
- Avoids extra paid vector databases
- Supports cosine distance search with performant indexes

### 4.2 Why Raw SQL with Prisma
- Prisma currently does not natively model vector columns/operators
- Raw SQL in Prisma is the standard practical approach for pgvector operations

### 4.3 Why Chunk + Upsert
- Chunking improves retrieval quality for long documents
- Deterministic chunkKey enables idempotent reindexing
- Upsert reduces duplicate vectors and keeps index fresh

### 4.4 Why Separate Services
- embedding.service.ts isolates provider integration
- llm.service.ts isolates answer generation integration
- rag.service.ts orchestrates ingest/retrieve/generate flow
- indexing.service.ts handles docs and DB entity indexing

## 5. API Endpoints

Base path:
- /api/v1/rag

### 5.1 POST /query
Auth:
- Required (SUPER_ADMIN, ADMIN, DOCTOR, PATIENT)

Request body:
```json
{
  "query": "Who are available cardiology specialists?",
  "topK": 5,
  "minSimilarity": 0.2,
  "sourceTypes": ["DOCTOR", "SPECIALTY"]
}
```

Response data shape:
```json
{
  "answer": "...",
  "citations": [
    {
      "sourceType": "DOCTOR",
      "sourceId": "...",
      "sourceLabel": "...",
      "similarity": 0.82,
      "snippet": "...",
      "metadata": {}
    }
  ],
  "retrieval": {
    "totalMatches": 5
  }
}
```

### 5.2 POST /ingest
Auth:
- Required (SUPER_ADMIN, ADMIN)

Request body:
```json
{
  "sourceType": "DOC_MARKDOWN",
  "sourceId": "Tasks/RAG-Integration.md",
  "sourceLabel": "RAG Integration",
  "content": "Long content...",
  "metadata": { "section": "guide" },
  "chunkSize": 900,
  "chunkOverlap": 120
}
```

### 5.3 POST /reindex
Auth:
- Required (SUPER_ADMIN, ADMIN)

Request body:
```json
{
  "includeDocs": true,
  "includeDb": true,
  "sourceTypes": ["DOC_MARKDOWN", "DOCTOR", "SPECIALTY"]
}
```

### 5.4 GET /stats
Auth:
- Required (SUPER_ADMIN, ADMIN)

Returns total embeddings and counts by sourceType.

## 6. Reindex Data Sources

### 6.1 Markdown Docs
- Recursively scans configured directories (default: Tasks)
- Reads .md files
- Ingests each document into chunked embeddings

### 6.2 Database Entities
- Doctors (including joined specialty titles)
- Specialties

## 7. How Retrieval Works
1. Query text is embedded by Hugging Face
2. Similarity search runs in PostgreSQL with cosine distance on vector index
3. Top-k context chunks are assembled
4. Groq model generates grounded answer from retrieved context
5. API returns answer + citations (snippet, metadata, similarity)

## 8. Required Environment Variables

Add to .env:
```env
GROQ_API_KEY=your_groq_api_key
HF_API_KEY=your_hf_api_key
RAG_GROQ_MODEL=llama-3.3-70b-versatile
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CHUNK_SIZE=900
RAG_CHUNK_OVERLAP=120
RAG_DOC_DIRS=Tasks
```

## 9. Runbook

### 9.1 Apply Migration
```bash
pnpm exec prisma db execute --file prisma/sql/01_enable_pgvector.sql --schema prisma/schema
pnpm run migrate -- --name rag_document_embeddings
pnpm exec prisma db execute --file prisma/sql/02_rag_vector_indexes.sql --schema prisma/schema
```

Why this order:
- First command enables pgvector so vector type exists before migration applies.
- Second command applies Prisma-generated migration (no manual migration editing).
- Third command adds HNSW index, which is optional but recommended for scale.

### 9.2 Start Server
```bash
pnpm run dev
```

### 9.3 Initial Reindex
Call:
- POST /api/v1/rag/reindex

with admin/super-admin auth cookies.

### 9.4 Query
Call:
- POST /api/v1/rag/query

with authenticated user cookies.

## 10. Validation and Operational Notes
- Query endpoint is authenticated only, aligned with healthcare sensitivity.
- Retrieval threshold can be tuned by minSimilarity.
- When no good context is found, API returns a safe fallback answer.
- Feature uses free services but production reliability still depends on API availability/rate limits.

## 11. Known Limitations
- No streaming responses yet.
- No re-ranker layer (cross-encoder) yet.
- DB source coverage currently starts with doctor + specialty.
- Rate-limit/backoff strategy is minimal and can be enhanced.

## 12. References Followed

Official documentation and primary references used while implementing this feature:

1. pgvector (official)
- https://github.com/pgvector/pgvector

2. PostgreSQL extension and indexing docs
- https://www.postgresql.org/docs/current/index.html

3. Prisma raw SQL guidance
- https://www.prisma.io/docs/orm/prisma-client/using-raw-sql

4. Groq API docs (OpenAI-compatible)
- https://console.groq.com/docs/overview
- https://console.groq.com/docs/openai

5. Hugging Face Inference API docs
- https://huggingface.co/docs/api-inference/index

6. RAG foundational paper
- Lewis et al. 2020 (RAG): https://arxiv.org/abs/2005.11401

Practical articles used for implementation decisions:

7. Pinecone RAG primer (architecture and tradeoffs)
- https://www.pinecone.io/learn/retrieval-augmented-generation/

8. Hugging Face RAG cookbook examples
- https://huggingface.co/learn/cookbook/en/rag_with_hf_and_milvus

## 13. Why These References Were Followed
- They are primary or widely accepted technical sources for the exact stack used.
- They provide current best practices for vector search, RAG architecture, and provider APIs.
- They match the free-tier requirement and integrate cleanly with this backend.
