import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { RAG_DEFAULTS } from "./rag.constant";

interface IHfEmbeddingResponse {
    [index: number]: number[];
    length: number;
}

const getEmbeddingApiKey = () => {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
        throw new AppError(status.BAD_REQUEST, "HF_API_KEY is missing. Configure it before using RAG.");
    }

    return apiKey;
};

const meanPool = (tokenEmbeddings: number[][]): number[] => {
    const dimensions = tokenEmbeddings[0]?.length || 0;

    if (!dimensions) {
        return [];
    }

    const pooled = Array.from({ length: dimensions }, () => 0);

    tokenEmbeddings.forEach((vector) => {
        for (let idx = 0; idx < dimensions; idx += 1) {
            pooled[idx] += vector[idx] || 0;
        }
    });

    return pooled.map((value) => value / tokenEmbeddings.length);
};

const normalizeToVector = (payload: unknown): number[] => {
    if (Array.isArray(payload) && payload.every((item) => typeof item === "number")) {
        return payload as number[];
    }

    if (
        Array.isArray(payload)
        && payload.length > 0
        && payload.every((item) => Array.isArray(item) && item.every((entry) => typeof entry === "number"))
    ) {
        return meanPool(payload as number[][]);
    }

    return [];
};

const generateEmbedding = async (text: string): Promise<number[]> => {
    const apiKey = getEmbeddingApiKey();

    const response = await fetch(`https://api-inference.huggingface.co/models/${RAG_DEFAULTS.EMBEDDING_MODEL}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: text,
            options: {
                wait_for_model: true,
            },
        }),
    });

    if (!response.ok) {
        const details = await response.text();
        throw new AppError(status.BAD_GATEWAY, `Embedding provider failed: ${details}`);
    }

    const data = (await response.json()) as IHfEmbeddingResponse | number[] | number[][];
    const vector = normalizeToVector(data);

    if (!vector.length) {
        throw new AppError(status.BAD_GATEWAY, "Embedding provider returned an unexpected payload.");
    }

    return vector;
};

export const EmbeddingService = {
    generateEmbedding,
};
