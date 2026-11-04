import { Request, Response, NextFunction } from "express";
import AuthModel from "../models/auth";
import { verifyAccessToken } from "../utils/authTokens";

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        user_name: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = verifyAccessToken<{ _id: string; user_name: string }>(token);
        
        // Optional: Verify that the auth record still exists
        const auth = await AuthModel.findOne({ userId: decoded._id });
        if (!auth) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid session" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }
};
