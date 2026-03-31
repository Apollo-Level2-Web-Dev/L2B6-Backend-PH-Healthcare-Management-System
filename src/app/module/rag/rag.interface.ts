import { RagSourceType } from "./rag.constant";

export interface IRagDocument {
    sourceType: RagSourceType;
    sourceId: string;
    sourceLabel?: string;
    content: string;
    metadata?: Record<string, unknown>;
}

export interface IRagIngestRequest extends IRagDocument {
    chunkSize?: number;
    chunkOverlap?: number;
}

export interface IRagQueryRequest {
    query: string;
    topK?: number;
    minSimilarity?: number;
    sourceTypes?: RagSourceType[];
}

export interface IRagChunk {
    chunkKey: string;
    content: string;
    index: number;
}

export interface IRagMatch {
    id: string;
    sourceType: string;
    sourceId: string;
    sourceLabel: string | null;
    content: string;
    metadata: unknown;
    similarity: number;
}

export interface IRagCitation {
    sourceType: string;
    sourceId: string;
    sourceLabel: string | null;
    similarity: number;
    snippet: string;
    metadata: unknown;
}
