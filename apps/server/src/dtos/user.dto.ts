export interface UserProfileResponse {
    id: string;
    user_name: string;
    email: string;
    avatar?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateProfileRequest {
    avatar?: string;
    bio?: string;
}
