import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ReviewService } from "./review.service";

const giveReview = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    const result = await ReviewService.giveReview(user, payload);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Review created successfully',
        data: result,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {

    const result = await ReviewService.getAllReviews();
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieval successfully',
        data: result
    });
});

const myReviews = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await ReviewService.myReviews(user);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieval successfully',
        data: result
    });

});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const reviewId = req.params.id;
    const payload = req.body;

    const result = await ReviewService.updateReview(user, reviewId as string, payload);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Review updated successfully',
        data: result
    });
}
);

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const reviewId = req.params.id;
    const result = await ReviewService.deleteReview(user, reviewId as string);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: 'Review deleted successfully',
        data: result
    });
});


export const ReviewController = {
    giveReview,
    getAllReviews,
    myReviews,
    updateReview,
    deleteReview
}