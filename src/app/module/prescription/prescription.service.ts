/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../utils/email";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { generatePrescriptionPDF } from "./prescription.utils";

const givePrescription = async (user : IRequestUser, payload : ICreatePrescriptionPayload) => {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            email: user?.email
        },
    });

    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: payload.appointmentId
        },
        include: {
            patient: true,
            doctor: {
                include:{
                    specialties: true
                }
            },
            schedule: {
                include:{
                    doctorSchedules: true
                }
            },
        }
    });

    if(appointmentData.doctorId !== doctorData.id){
        throw new AppError(status.BAD_REQUEST, "You can only give prescription for your own appointments");
    }

    const isAlreadyPrescribed = await prisma.prescription.findFirst({
        where: {
            appointmentId : payload.appointmentId
        }
    });

    if (isAlreadyPrescribed) {
        throw new AppError(status.BAD_REQUEST, "You have already given prescription for this appointment. You can update the prescription instead.");
    }

    const followUpDate = new Date(payload.followUpDate);

   

   const result = await prisma.$transaction(async (tx) => {
       const result = await tx.prescription.create({
           data: {
               ...payload,
               followUpDate,
               doctorId: appointmentData.doctorId,
               patientId: appointmentData.patientId,
           }
       });

       const pdfBuffer = await generatePrescriptionPDF({
           doctorName: doctorData.name,
           patientName: appointmentData.patient.name,
           appointmentDate: appointmentData.schedule.startDateTime,
           instructions: payload.instructions,
           followUpDate,
           doctorEmail: doctorData.email,
           patientEmail: appointmentData.patient.email,
           prescriptionId: result.id,
           createdAt: new Date(),
       });

       const fileName = `Prescription-${Date.now()}.pdf`;
       const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName);
       const pdfUrl = uploadedFile.secure_url;

       const updatedPrescription = await tx.prescription.update({
           where: {
               id: result.id
           },
           data: {
               pdfUrl
           }
       });

       try {
        const patient = appointmentData.patient;
        const doctor = appointmentData.doctor;

           await sendEmail({
               to: patient.email,
               subject: `You have received a new prescription from Dr. ${doctor.name}`,
               templateName: "prescription",
               templateData: {
                    doctorName: doctor.name,
                    patientName: patient.name,
                    specialization: doctor.specialties.map((s : any )=> s.title).join(", "),
                    appointmentDate: new Date(appointmentData.schedule.startDateTime).toLocaleString(),
                    issuedDate: new Date().toLocaleDateString(),
                    prescriptionId: result.id,
                    instructions: payload.instructions,
                    followUpDate: followUpDate.toLocaleDateString(),
                    pdfUrl: pdfUrl
               },
               attachments:[
                {
                    filename: fileName,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
               ]
           })
       } catch (error) {
            console.log("Failed To send email notification for prescription", error);
       }

       return updatedPrescription;
   }, {
    maxWait : 15000,
    timeout: 20000,
   });

    return result;
  
};

const myPrescriptions = async (user: IRequestUser) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            email: user?.email
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (isUserExists.role === Role.DOCTOR) {
        const prescriptions = await prisma.prescription.findMany({
            where: {
                doctor: {
                    email: user?.email
                }
            },
            include: {
                patient: true,
                doctor: true,
                appointment: true,
            }
        });
        return prescriptions;
    }

    if (isUserExists.role === Role.PATIENT) {
        const prescriptions = await prisma.prescription.findMany({
            where: {
                patient: {
                    email: user?.email
                }
            },
            include: {
                patient: true,
                doctor: true,
                appointment: true,
            }
        });
        return prescriptions;
    }


};

const getAllPrescriptions = async () => {
    const result = await prisma.prescription.findMany({
        include: {
            patient: true,
            doctor: true,
            appointment: true,
        }
    })

    return result;
};

const updatePrescription = async (user: IRequestUser, prescriptionId: string, payload: any) => {
    // Verify user exists
    const isUserExists = await prisma.user.findUnique({
        where: {
            email: user?.email
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Fetch current prescription data
    const prescriptionData = await prisma.prescription.findUniqueOrThrow({
        where: {
            id: prescriptionId
        },
        include: {
            doctor: true,
            patient: true,
            appointment: {
                include: {
                    schedule: true
                }
            }
        }
    });

    // Verify the user is the doctor for this prescription
    if (!(user?.email === prescriptionData.doctor.email)) {
        throw new AppError(status.BAD_REQUEST, "This is not your prescription!")
    }

    // Prepare updated data
    const updatedInstructions = payload.instructions || prescriptionData.instructions;
    const updatedFollowUpDate = payload.followUpDate
        ? new Date(payload.followUpDate)
        : prescriptionData.followUpDate;

    // Step 1: Generate new PDF with updated data
    const pdfBuffer = await generatePrescriptionPDF({
        doctorName: prescriptionData.doctor.name,
        doctorEmail: prescriptionData.doctor.email,
        patientName: prescriptionData.patient.name,
        patientEmail: prescriptionData.patient.email,
        appointmentDate: prescriptionData.appointment.schedule.startDateTime,
        instructions: updatedInstructions,
        followUpDate: updatedFollowUpDate,
        prescriptionId: prescriptionData.id,
        createdAt: prescriptionData.createdAt,
    });

    // Step 2: Upload new PDF to Cloudinary
    const fileName = `prescription-updated-${Date.now()}.pdf`;
    const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName);
    const newPdfUrl = uploadedFile.secure_url;

    // Step 3: Delete old PDF from Cloudinary if it exists
    if (prescriptionData.pdfUrl) {
        try {
            await deleteFileFromCloudinary(prescriptionData.pdfUrl);
        } catch (deleteError) {
            // Log but don't fail
            console.error("Failed to delete old PDF from Cloudinary:", deleteError);
        }
    }

    // Step 4: Update prescription in database
    const result = await prisma.prescription.update({
        where: {
            id: prescriptionId
        },
        data: {
            instructions: updatedInstructions,
            followUpDate: updatedFollowUpDate,
            pdfUrl: newPdfUrl
        },
        include: {
            patient: true,
            doctor: true,
            appointment: {
                include: {
                    schedule: true
                }
            },
            
        }
    });

    // Step 5: Send updated prescription email to patient
    try {
        await sendEmail({
            to: result.patient.email,
            subject: `Your Prescription has been Updated by ${result.doctor.name}`,
            templateName: "prescription",
            templateData: {
                patientName: result.patient.name,
                doctorName: result.doctor.name,
                specialization: "Healthcare Provider",
                prescriptionId: result.id,
                appointmentDate: new Date(result.appointment.schedule.startDateTime).toLocaleString(),
                issuedDate: new Date(result.createdAt).toLocaleDateString(),
                followUpDate: new Date(result.followUpDate).toLocaleDateString(),
                instructions: result.instructions,
                pdfUrl: newPdfUrl
            },
            attachments: [
                {
                    filename: `Prescription-${result.id}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });
    } catch (emailError) {
        // Log email error but don't fail the prescription update
        console.error("Failed to send updated prescription email:", emailError);
    }

    return result;
};

const deletePrescription = async (user: IRequestUser, prescriptionId: string): Promise<void> => {
    // Verify user exists
    const isUserExists = await prisma.user.findUnique({
        where: {
            email: user?.email
        }
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Fetch prescription data
    const prescriptionData = await prisma.prescription.findUniqueOrThrow({
        where: {
            id: prescriptionId
        },
        include: {
            doctor: true
        }
    });

    // Verify the user is the doctor for this prescription
    if (!(user?.email === prescriptionData.doctor.email)) {
        throw new AppError(status.BAD_REQUEST, "This is not your prescription!")
    }

    // Delete PDF from Cloudinary if it exists
    if (prescriptionData.pdfUrl) {
        try {
            await deleteFileFromCloudinary(prescriptionData.pdfUrl);
        } catch (deleteError) {
            // Log but don't fail - still delete from database
            console.error("Failed to delete PDF from Cloudinary:", deleteError);
        }
    }

    // Delete prescription from database
    await prisma.prescription.delete({
        where: {
            id: prescriptionId
        }
    });
}


export const PrescriptionService = {
    givePrescription,
    myPrescriptions,
    getAllPrescriptions,
    updatePrescription,
    deletePrescription
}