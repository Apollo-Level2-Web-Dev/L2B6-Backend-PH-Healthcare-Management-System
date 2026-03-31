import { createHash, randomUUID } from "crypto";
import { IRagChunk, IRagCitation, IRagMatch } from "./rag.interface";

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const truncate = (value: string, maxLength: number) => {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength).trim()}...`;
};

const splitIntoChunks = (content: string, chunkSize: number, chunkOverlap: number): IRagChunk[] => {
    const normalized = normalizeWhitespace(content);

    if (normalized.length <= chunkSize) {
        return [
            {
                chunkKey: createHash("sha256").update(normalized).digest("hex"),
                content: normalized,
                index: 0,
            },
        ];
    }

    const chunks: IRagChunk[] = [];
    const stride = Math.max(1, chunkSize - chunkOverlap);
    let index = 0;

    for (let start = 0; start < normalized.length; start += stride) {
        const end = Math.min(normalized.length, start + chunkSize);
        const chunk = normalized.slice(start, end).trim();

        if (!chunk) {
            continue;
        }

        chunks.push({
            chunkKey: createHash("sha256").update(`${index}:${chunk}`).digest("hex"),
            content: chunk,
            index,
        });

        index += 1;

        if (end >= normalized.length) {
            break;
        }
    }

    return chunks;
};

const createRowId = () => randomUUID();

const buildPromptContext = (matches: IRagMatch[]) => {
    return matches
        .map((item, idx) => {
            const snippet = truncate(item.content, 400);
            return `Context ${idx + 1}\nSourceType: ${item.sourceType}\nSourceId: ${item.sourceId}\nSourceLabel: ${item.sourceLabel || "N/A"}\nSimilarity: ${item.similarity.toFixed(4)}\nSnippet: ${snippet}`;
        })
        .join("\n\n");
};

const buildCitations = (matches: IRagMatch[]): IRagCitation[] => {
    return matches.map((item) => ({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        sourceLabel: item.sourceLabel,
        similarity: Number(item.similarity.toFixed(4)),
        snippet: truncate(item.content, 220),
        metadata: item.metadata,
    }));
};

export const RagUtils = {
    normalizeWhitespace,
    splitIntoChunks,
    createRowId,
    buildPromptContext,
    buildCitations,
};
