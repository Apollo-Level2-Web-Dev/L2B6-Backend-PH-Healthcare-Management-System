export interface ICreatePrescriptionPayload {
    appointmentId: string;
    followUpDate: Date;
    instructions: string;
}

export interface IUpdatePrescriptionPayload {
    followUpDate?: Date;
    instructions?: string;
}

