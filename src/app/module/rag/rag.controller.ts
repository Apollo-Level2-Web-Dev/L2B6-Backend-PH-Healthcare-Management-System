import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { RagService } from "./rag.service";

const ingestDocument = catchAsync(async (req: Request, res: Response) => {
    const result = await RagService.ingestDocument(req.body);

    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        message: "RAG document ingested successfully",
        data: result,
    });
});

const queryKnowledge = catchAsync(async (req: Request, res: Response) => {
    const result = await RagService.queryKnowledge(req.body);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "RAG query executed successfully",
        data: result,
    });
});

const reindexKnowledge = catchAsync(async (req: Request, res: Response) => {
    const result = await RagService.reindexKnowledge(req.body);

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "RAG reindex completed successfully",
        data: result,
    });
});

const getStats = catchAsync(async (_req: Request, res: Response) => {
    const result = await RagService.getStats();

    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        message: "RAG stats fetched successfully",
        data: result,
    });
});

export const RagController = {
    ingestDocument,
    queryKnowledge,
    reindexKnowledge,
    getStats,
};
