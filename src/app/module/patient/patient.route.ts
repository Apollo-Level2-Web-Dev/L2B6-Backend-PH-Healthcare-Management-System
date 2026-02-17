import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PatientController } from "./patient.controller";
import { updateMyPatientProfileMiddleware } from "./patient.middlewares";
import { PatientValidation } from "./patient.validation";

const router = Router();

router.patch("/update-my-profile",
    checkAuth(Role.PATIENT),
    multerUpload.fields([
        { name : "profilePhoto", maxCount : 1},
        { name : "medicalReports", maxCount : 5}
    ]),
    //     const payload : IUpdatePatientProfilePayload = req.body;

    //     const files = req.files as {[fieldName : string] : Express.Multer.File[] | undefined};

    //     if(files?.profilePhoto?.[0]){
    //         if(!payload.patientInfo){
    //             payload.patientInfo = {} as IUpdatePatientInfoPayload;
    //         }
    //         payload.patientInfo.profilePhoto = files.profilePhoto[0].path;
    //     }

    //     if(files?.medicalReports && files?.medicalReports.length > 0){
    //         const newReports = files.medicalReports.map(file => ({
    //             reportName : file.originalname || `Medical Report - ${new Date().getTime()}`,
    //             reportLink : file.path,
    //         }))

    //         if(payload.medicalReports && Array.isArray(payload.medicalReports)){
    //             payload.medicalReports = [...payload.medicalReports, ...newReports]
    //         }else{
    //             payload.medicalReports = newReports;
    //         }
    //     }

    //     req.body = payload;

    //     next();
    // },
    updateMyPatientProfileMiddleware,
    validateRequest(PatientValidation.updatePatientProfileZodSchema),
    PatientController.updateMyProfile
)

export const PatientRoutes = router;