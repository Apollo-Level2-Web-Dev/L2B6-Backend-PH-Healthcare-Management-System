import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { EmbeddingService } from "./embedding.service";
import { LlmService } from "./llm.service";
import { RAG_DEFAULTS, RAG_DOC_DIRECTORIES } from "./rag.constant";
import { IRagIngestRequest, IRagMatch, IRagQueryRequest } from "./rag.interface";
import { RagUtils } from "./rag.utils";

const toVectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

const ingestDocument = async (payload: IRagIngestRequest) => {
    const chunkSize = payload.chunkSize || RAG_DEFAULTS.CHUNK_SIZE;
    const chunkOverlap = payload.chunkOverlap || RAG_DEFAULTS.CHUNK_OVERLAP;
    const chunks = RagUtils.splitIntoChunks(payload.content, chunkSize, chunkOverlap);

    for (const chunk of chunks) {
        const embedding = await EmbeddingService.generateEmbedding(chunk.content);
        const vectorLiteral = toVectorLiteral(embedding);

        await prisma.$executeRaw(Prisma.sql`
            INSERT INTO "document_embeddings"
            (
                "id",
                "chunkKey",
                "sourceType",
                "sourceId",
                "sourceLabel",
                "content",
                "metadata",
                "embedding",
                "updatedAt"
            )
            VALUES
            (
                ${RagUtils.createRowId()},
                ${`${payload.sourceType}:${payload.sourceId}:${chunk.chunkKey}`},
                ${payload.sourceType},
                ${payload.sourceId},
                ${payload.sourceLabel || null},
                ${chunk.content},
                ${JSON.stringify(payload.metadata || {})}::jsonb,
                CAST(${vectorLiteral} AS vector),
                NOW()
            )
            ON CONFLICT ("chunkKey")
            DO UPDATE SET
                "sourceType" = EXCLUDED."sourceType",
                "sourceId" = EXCLUDED."sourceId",
                "sourceLabel" = EXCLUDED."sourceLabel",
                "content" = EXCLUDED."content",
                "metadata" = EXCLUDED."metadata",
                "embedding" = EXCLUDED."embedding",
                "isDeleted" = false,
                "deletedAt" = null,
                "updatedAt" = NOW()
        `);
    }

    return {
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        chunksStored: chunks.length,
    };
};

const retrieveMatches = async (payload: IRagQueryRequest): Promise<IRagMatch[]> => {
    const topK = payload.topK || RAG_DEFAULTS.TOP_K;
    const minSimilarity = payload.minSimilarity ?? RAG_DEFAULTS.MIN_SIMILARITY;
    const queryEmbedding = await EmbeddingService.generateEmbedding(payload.query);
    const queryVectorLiteral = toVectorLiteral(queryEmbedding);

    const sourceTypesCondition = payload.sourceTypes?.length
        ? Prisma.sql`AND "sourceType" IN (${Prisma.join(payload.sourceTypes)})`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<IRagMatch[]>(Prisma.sql`
        SELECT
            "id",
            "sourceType",
            "sourceId",
            "sourceLabel",
            "content",
            "metadata",
            (1 - ("embedding" <=> CAST(${queryVectorLiteral} AS vector))) AS "similarity"
        FROM "document_embeddings"
        WHERE "isDeleted" = false
        ${sourceTypesCondition}
        AND (1 - ("embedding" <=> CAST(${queryVectorLiteral} AS vector))) >= ${minSimilarity}
        ORDER BY "embedding" <=> CAST(${queryVectorLiteral} AS vector)
        LIMIT ${topK}
    `);

    return rows;
};

const queryKnowledge = async (payload: IRagQueryRequest) => {
    const matches = await retrieveMatches(payload);

    if (!matches.length) {
        return {
            answer: "I do not have enough indexed context to answer this query yet.",
            citations: [],
            retrieval: {
                totalMatches: 0,
            },
        };
    }

    const context = RagUtils.buildPromptContext(matches);
    const answer = await LlmService.generateGroundedAnswer({
        question: payload.query,
        context,
    });

    return {
        answer,
        citations: RagUtils.buildCitations(matches),
        retrieval: {
            totalMatches: matches.length,
        },
    };
};

const reindexKnowledge = async (payload: { includeDocs?: boolean; includeDb?: boolean; sourceTypes?: IRagQueryRequest["sourceTypes"] }) => {
    const { IndexingService } = await import("./indexing.service");

    return IndexingService.reindex({
        includeDocs: payload.includeDocs,
        includeDb: payload.includeDb,
        sourceTypes: payload.sourceTypes,
        docDirectories: RAG_DOC_DIRECTORIES,
    });
};

const getStats = async () => {
    const stats = await prisma.$queryRaw<Array<{ sourceType: string; count: bigint }>>(Prisma.sql`
        SELECT "sourceType", COUNT(*)::bigint AS count
        FROM "document_embeddings"
        WHERE "isDeleted" = false
        GROUP BY "sourceType"
        ORDER BY "sourceType" ASC
    `);

    return {
        total: stats.reduce((acc, item) => acc + Number(item.count), 0),
        bySourceType: stats.map((item) => ({
            sourceType: item.sourceType,
            count: Number(item.count),
        })),
    };
};

export const RagService = {
    ingestDocument,
    queryKnowledge,
    reindexKnowledge,
    getStats,
};
