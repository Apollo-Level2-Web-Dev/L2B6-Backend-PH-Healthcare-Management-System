import z from "zod";
import { RAG_ALLOWED_SOURCE_TYPES, RAG_DEFAULTS } from "./rag.constant";

const sourceTypeEnum = z.enum(RAG_ALLOWED_SOURCE_TYPES);

const ingestZodSchema = z.object({
    sourceType: sourceTypeEnum,
    sourceId: z.string().min(1, "sourceId is required"),
    sourceLabel: z.string().optional(),
    content: z.string().min(1, "content is required").max(RAG_DEFAULTS.MAX_INGEST_CONTENT_LENGTH),
    metadata: z.record(z.string(), z.unknown()).optional(),
    chunkSize: z.number().int().min(100).max(2000).optional(),
    chunkOverlap: z.number().int().min(0).max(500).optional(),
});

const queryZodSchema = z.object({
    query: z.string().min(1, "query is required").max(RAG_DEFAULTS.MAX_QUERY_LENGTH),
    topK: z.number().int().min(1).max(20).optional(),
    minSimilarity: z.number().min(0).max(1).optional(),
    sourceTypes: z.array(sourceTypeEnum).optional(),
});

const reindexZodSchema = z.object({
    includeDocs: z.boolean().optional(),
    includeDb: z.boolean().optional(),
    sourceTypes: z.array(sourceTypeEnum).optional(),
});

export const RagValidation = {
    ingestZodSchema,
    queryZodSchema,
    reindexZodSchema,
};
