/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";

export const deleteUploadedFilesFromGlobalErrorHandler = async (req: Request) => {
    try {
        const filesToDelete : string[] = [];

        if(req.file && req.file?.path){
            filesToDelete.push(req.file.path);
        }else if(req.files && typeof req.files === 'object' && !Array.isArray(req.files)){
            // [ [{path : "rfrf"}] , [{}, {}]]
            Object.values(req.files).forEach(fileArray =>{
                if(Array.isArray(fileArray)){
                    fileArray.forEach(file => {
                        if(file.path){
                            filesToDelete.push(file.path);
                        }
                    })
                }
            })
        }else if(req.files && Array.isArray(req.files) && req.files.length > 0){
            req.files.forEach(file => {
                if(file.path){
                    filesToDelete.push(file.path);
                }
            })
        }

        if(filesToDelete.length > 0){

            await Promise.all(
                filesToDelete.map(url => deleteFileFromCloudinary(url))
            )
            console.log(`\nDeleted ${filesToDelete.length} uploaded file(s) from Cloudinary due to an error during request processing.\n`);
        }
        
    } catch (error : any) {
        console.error("Error deleting uploaded files from Global Error Handler", error);
        
    }
}