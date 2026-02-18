export interface ICreateReviewPayload {
    appointmentId: string;
    rating: number;
    comment: string;
}

export interface IUpdateReviewPayload {
    rating: number;
    comment: string;
}