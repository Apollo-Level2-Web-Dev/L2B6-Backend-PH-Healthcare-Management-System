export interface ICreateDoctorSchedulePayload {
    scheduleIds : string[];
}

export interface IUpdateDoctorSchedulePayload {
    scheduleIds :{
        shouldDelete : boolean;
        id : string;
    }[]
}