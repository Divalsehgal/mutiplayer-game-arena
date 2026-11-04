import { UserProfileResponse } from "../../dtos/user.dto";
import UserModel from "../../models/user";

export class UserService {
    /**
     * Fetch user profile by ID
     */
    async getProfile(userId: string): Promise<UserProfileResponse> {
        const user = await UserModel.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Map model to DTO
        return {
            id: user._id.toString(),
            user_name: user.user_name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    /**
     * Update user profile logic
     */
    async updateProfile(userId: string, updateData: Record<string, unknown>) {
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            throw new Error("Failed to update profile");
        }
        return updatedUser;
    }

}

