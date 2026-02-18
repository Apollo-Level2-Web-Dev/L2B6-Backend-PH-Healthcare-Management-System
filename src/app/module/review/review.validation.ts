import { z } from 'zod';

const createReviewZodSchema = z.object({
    appointmentId: z.string("Appointment ID is required"),
    rating: z.number("Rating is required").min(1, "Rating must be at least 1").max(5, "Rating cannot be more than 5"),
    comment: z.string("Comment is required").min(1, "Comment cannot be empty")
});

const updateReviewZodSchema = z.object({
    rating: z.number("Rating is required").min(1, "Rating must be at least 1").max(5, "Rating cannot be more than 5").optional(),
    comment: z.string("Comment is required").min(1, "Comment cannot be empty").optional()
});

export const ReviewValidation = {
    createReviewZodSchema,
    updateReviewZodSchema
};