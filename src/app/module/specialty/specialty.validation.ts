import z from "zod";

const createSpecialtyZodSchema = z.object({
    title : z.string("Title is required"),
    description : z.string("Description is required").optional(),
})

export const SpecialtyValidation = {
    createSpecialtyZodSchema
}