import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { UserService } from "../../services/user";
import { logger } from "../../utils/logger";

const userService = new UserService();

/**
 * Get current user profile
 */
export const getProfileHandler = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        // Delegate to Service Layer
        const profile = await userService.getProfile(req.user._id);

        res.status(200).json({ 
            success: true, 
            data: profile 
        });
    } catch (err) {
        const error = err as Error;
        if (error.message === "User not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        logger.error("Loading profile failed:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

/**
 * Update current user profile
 */
export const updateProfileHandler = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const updatedProfile = await userService.updateProfile(req.user._id, req.body);

        res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully",
            data: updatedProfile 
        });
    } catch (err) {
        logger.error("Updating profile failed:", err);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};
