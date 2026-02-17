
export interface IBookAppointmentPayload {
    doctorId : string,
    scheduleId : string,
}

export interface IUpdateAppointmentPayload {
    doctorId? : string,
    scheduleId? : string,
    status? : string,
}