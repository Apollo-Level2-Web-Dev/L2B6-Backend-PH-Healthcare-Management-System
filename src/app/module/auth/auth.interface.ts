export interface ILoginUserPayload {
    email: string;
    password: string;
}

export interface IRegisterPatientPayload {
    name: string;
    email: string;
    password: string;
}

export interface IChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}