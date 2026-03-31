import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { RAG_DEFAULTS, RAG_PROMPT_SYSTEM } from "./rag.constant";

interface IGroqResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

const getGroqApiKey = () => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new AppError(status.BAD_REQUEST, "GROQ_API_KEY is missing. Configure it before using RAG.");
    }

    return apiKey;
};

const generateGroundedAnswer = async (params: { question: string; context: string }) => {
    const apiKey = getGroqApiKey();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: RAG_DEFAULTS.GROQ_MODEL,
            temperature: 0.1,
            messages: [
                {
                    role: "system",
                    content: RAG_PROMPT_SYSTEM,
                },
                {
                    role: "user",
                    content: `Question:\n${params.question}\n\nContext:\n${params.context}`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const details = await response.text();
        throw new AppError(status.BAD_GATEWAY, `Generation provider failed: ${details}`);
    }

    const payload = (await response.json()) as IGroqResponse;
    const answer = payload.choices?.[0]?.message?.content?.trim();

    if (!answer) {
        throw new AppError(status.BAD_GATEWAY, "Generation provider returned an empty response.");
    }

    return answer;
};

export const LlmService = {
    generateGroundedAnswer,
};
