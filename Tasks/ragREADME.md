# What We Have Done in the RAG Module

## Overview
The RAG (Retrieval-Augmented Generation) module enables semantic search over doctor data and generates AI-powered answers using retrieved context. It consists of embedding generation, vector storage, and LLM integration.

## Core Components

### 1. Services (`src/app/module/rag/`)
- **EmbeddingService**: Generates vector embeddings for text using an embedding model.
- **IndexingService**: Handles ingestion of doctor data into the `document_embeddings` table with vector embeddings.
- **LLMService**: Interacts with the language model to generate answers based on retrieved context.
- **RAGService**: Orchestrates the RAG pipeline:
  - `ingestDoctorsData()`: Triggers indexing of doctor records.
  - `retrieveRelevantDocuments(query, limit, sourceType)`: Performs vector similarity search.
  - `generateAnswer(query, limit, sourceType, asJson)`: Retrieves context and generates LLM response.
  - `getStats()`: Returns statistics about stored embeddings.

### 2. Controller (`src/app/module/rag/rag.controller.ts`)
- `getStats`: GET endpoint to retrieve RAG statistics.
- `ingestDoctors`: POST endpoint to (re)index doctor data.
- `queryRag`: POST endpoint to ask a question and get an AI-generated answer with sources.

### 3. Routes (`src/app/module/rag/rag.route.ts`)
- `GET /stats` → `RagController.getStats`
- `POST /ingest-doctors` → `RagController.ingestDoctors`
- `POST /query` → `RagController.queryRag`

## Data Flow

### Ingestion Flow
1. Controller receives `POST /ingest-doctors`.
2. Service calls `IndexingService.indexDoctorsData()`.
3. Fetches all non-deleted doctors with specialties and reviews from PostgreSQL.
4. For each doctor, builds a rich text content string containing:
   - Name, experience, qualification, designation, fee, workplace, rating.
   - Specialties list.
   - Patient reviews.
5. Generates an embedding vector for the content via `EmbeddingService`.
6. Upserts into `document_embeddings` table (using `chunkKey = doctor-{id}` as unique key).
7. Returns success count.

### Query Flow
1. Controller receives `POST /query` with `{ query, limit?, sourceType? }`.
2. Service validates query presence.
3. Calls `retrieveRelevantDocuments`:
   - Generates embedding for the query text.
   - Performs cosine similarity search via `1 - (embedding <=> query_vector)`.
   - Filters by `isDeleted = false` and optional `sourceType`.
   - Returns top `limit` matches.
4. Extracts content from retrieved documents to form context.
5. Calls `LLMService.generateResponse(query, context, asJson)` to get answer.
6. If `asJson=true`, attempts to parse JSON from LLM response (stripping markdown code fences).
7. Returns `{ answer, sources[], contextUsed }` where sources include document metadata and similarity scores.

### Stats Flow
- `GET /stats` → `RAGService.getStats()` runs two raw SQL queries:
  - Count of active embeddings.
  - Breakdown by sourceType (e.g., DOCTOR).
- Returns `{ totalActiveDocuments, sourceTypeBreakdown, timestamp }`.

## Key Features
- Vector similarity search using PostgreSQL `pgvector` (`<=>` operator).
- Automatic upsert to avoid duplicate embeddings per doctor.
- Rich contextual content for better retrieval quality.
- Source attribution with similarity scores in responses.
- Optional JSON-mode for structured LLM outputs.

## Usage Examples
### Index Doctor Data
```http
POST /ingest-doctors
```
### Ask a Question
```http
POST /query
Content-Type: application/json

{
  "query": "Who are the best cardiologists in Dhaka?",
  "limit": 5,
  "sourceType": "DOCTOR"
}
```
### Get Statistics
```http
GET /stats
```
