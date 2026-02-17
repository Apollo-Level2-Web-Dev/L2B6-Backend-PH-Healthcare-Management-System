/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { handleZodError } from "../errorHelpers/handleZodError";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import { deleteUploadedFilesFromGlobalErrorHandler } from "../utils/deleteUploadedFilesFromGlobalErrorHandler";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (envVars.NODE_ENV === 'development') {
        console.log("Error from Global Error Handler", err);
    }

    // if(req.file){
    //     await deleteFileFromCloudinary(req.file.path)
    // }

    // if(req.files && Array.isArray(req.files) && req.files.length > 0){
    //     const imageUrls = req.files.map((file) => file.path);
    //     await Promise.all(imageUrls.map(url => deleteFileFromCloudinary(url))); 
    // }
    await deleteUploadedFilesFromGlobalErrorHandler(req);

    let errorSources: TErrorSources[] = []
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal Server Error';
    let stack: string | undefined = undefined;

    //Zod Error Patttern
    /*
     error.issues; 
    /* [
      {
        expected: 'string',
        code: 'invalid_type',
        path: [ 'username' , 'password' ], => username password
        message: 'Invalid input: expected string'
      },
      {
        expected: 'number',
        code: 'invalid_type',
        path: [ 'xp' ],
        message: 'Invalid input: expected number'
      }
    ] 
    */

    if (err instanceof z.ZodError) {
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message
        errorSources = [...simplifiedError.errorSources]
        stack = err.stack;

    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        stack = err.stack;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ]
    }
    else if (err instanceof Error) {
        statusCode = status.INTERNAL_SERVER_ERROR;
        message = err.message
        stack = err.stack;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ]
    }


    const errorResponse: TErrorResponse = {
        success: false,
        message: message,
        errorSources,
        error: envVars.NODE_ENV === 'development' ? err : undefined,
        stack: envVars.NODE_ENV === 'development' ? stack : undefined,
    }

    res.status(statusCode).json(errorResponse);
}