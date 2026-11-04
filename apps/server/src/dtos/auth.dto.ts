export interface SignupRequest {
    user_name: string;
    email: string;
    password: string;
}

export interface SigninRequest {
    email: string;
    password: string;
}

export interface AuthResponseData {
    user: {
        id: string;
        user_name: string;
        email: string;
    };
    token: string;
}
