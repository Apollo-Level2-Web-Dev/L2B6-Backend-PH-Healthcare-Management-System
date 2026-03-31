CREATE INDEX IF NOT EXISTS "idx_document_embeddings_embedding_hnsw"
ON "document_embeddings"
USING hnsw ("embedding" vector_cosine_ops);
