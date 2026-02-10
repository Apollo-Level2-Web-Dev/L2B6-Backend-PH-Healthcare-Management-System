import z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const createDoctorZodSchema = z.object({
    password: z.string("Password is required").min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
    doctor: z.object({
        name: z.string("Name is required and must be string").min(5, "Name must be at least 5 characters").max(30, "Name must be at most 30 characters"),

        email: z.email("Invalid email address"),

        contactNumber: z.string("Contact number is required").min(11, "Contact number must be at least 11 characters").max(14, "Contact number must be at most 15 characters"),

        address: z.string("Address is required").min(10, "Address must be at least 10 characters").max(100, "Address must be at most 100 characters").optional(),

        registrationNumber: z.string("Registration number is required"),

        experience: z.int("Experience must be an integer").nonnegative("Experience cannot be negative").optional(),

        gender: z.enum([Gender.MALE, Gender.FEMALE], "Gender must be either MALE or FEMALE"),

        appointmentFee: z.number("Appointment fee must be a number").nonnegative("Appointment fee cannot be negative"),

        qualification: z.string("Qualification is required").min(2, "Qualification must be at least 2 characters").max(50, "Qualification must be at most 50 characters"),

        currentWorkingPlace: z.string("Current working place is required").min(2, "Current working place must be at least 2 characters").max(50, "Current working place must be at most 50 characters"),

        designation: z.string("Designation is required").min(2, "Designation must be at least 2 characters").max(50, "Designation must be at most 50 characters"),

    }),
    specialties: z.array(z.uuid(), "Specialties must be an array of strings").min(1, "At least one specialty is required")
})

export const createAdminZodSchema = z.object({
    password: z.string("Password is required").min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
    admin: z.object({
        name: z.string("Name is required and must be string").min(5, "Name must be at least 5 characters").max(30, "Name must be at most 30 characters"),
        email: z.email("Invalid email address"),
        contactNumber: z.string("Contact number is required").min(11, "Contact number must be at least 11 characters").max(14, "Contact number must be at most 15 characters").optional(),
        profilePhoto: z.url("Profile photo must be a valid URL").optional(),
    }),
    role: z.enum(["ADMIN", "SUPER_ADMIN"], "Role must be either ADMIN or SUPER_ADMIN")
})
