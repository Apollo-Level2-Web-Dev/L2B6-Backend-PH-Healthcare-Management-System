
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SpecialtyService } from "./specialty.service";

const createSpecialty = catchAsync(
    async (req: Request, res: Response) => {
        console.log(req.body);
        console.log(req.file);
        const payload = {
            ...req.body,
            icon : req.file?.path
        };
        const result = await SpecialtyService.createSpecialty(payload);
        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: 'Specialty created successfully',
            data: result
        });
    }
)


const getAllSpecialties = catchAsync(
    async (req: Request, res: Response) => {
        const result = await SpecialtyService.getAllSpecialties();
        sendResponse(res, {
            httpStatusCode: 200,
            success: true,
            message: 'Specialties fetched successfully',
            data: result
        });
    }
)

const deleteSpecialty = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await SpecialtyService.deleteSpecialty(id as string);
        sendResponse(res, {
            httpStatusCode: 200,
            success: true,
            message: 'Specialty deleted successfully',
            data: result
        });
    }
)

export const SpecialtyController = {
    createSpecialty,
    getAllSpecialties,
    deleteSpecialty
}