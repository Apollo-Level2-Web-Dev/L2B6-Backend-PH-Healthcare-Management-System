import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const getStats = async (req: Request, res: Response) => {
  console.log("connected", req.query);
  res.status(200).json({ message: "connected rag apis" });
};

const ingestDoctors = catchAsync(async (req: Request, res: Response) => {
 const result = await ragService.

  sendResponse(res,{
    success: true,
    httpStatusCode: status.OK,
    message: "Doctors data ingestion completed",
    data: result
  })
});

export const RagController = {
  getStats,
  ingestDoctors,
};
