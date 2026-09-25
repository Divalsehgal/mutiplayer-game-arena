import mongoose from "mongoose";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../../services/auth";

import { setAuthCookies } from "./helpers";
import AuthModel from "../../models/auth";
import UserModel from "../../models/user";
import { logger } from "../../utils/logger";

let googleClient: OAuth2Client | null = null;

const getGoogleOAuthCredentials = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Google OAuth env vars missing: set GOOGLE_CLIENT_ID/CLIENT_ID and GOOGLE_CLIENT_SECRET/CLIENT_SECRET"
        );
    }
    return { clientId, clientSecret };
};

const getGoogleClient = () => {
    if (!googleClient) {
        const { clientId, clientSecret } = getGoogleOAuthCredentials();
        googleClient = new OAuth2Client(clientId, clientSecret);
    }
    return googleClient;
};

const authService = new AuthService();

export const googleAuthHandler = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: "Google ID Token is required" });
        }

        const { clientId } = getGoogleOAuthCredentials();
        const client = getGoogleClient();

        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(401).json({ success: false, message: "Invalid Google token payload" });
        }

        const { email, name, picture, sub: googleId } = payload;

        let auth = await AuthModel.findOne({ email });
        let user = await UserModel.findOne({ email });

        if (auth) {
            if (!user) {
                user = await UserModel.create({
                    email,
                    user_name: name || email.split('@')[0],
                    avatar: picture
                });
                auth.userId = user._id as mongoose.Types.ObjectId;
            }
            if (!auth.googleId) auth.googleId = googleId;
            await auth.save();
            if (!user.avatar) {
                user.avatar = picture;
                await user.save();
            }
        } else if (user) {
            auth = await AuthModel.create({ userId: user._id, email, googleId });
        } else {
            let finalUserName = name || email.split('@')[0];
            const existingUserDoc = await UserModel.findOne({ user_name: finalUserName });
            if (existingUserDoc) {
                finalUserName = `${finalUserName}_${Math.random().toString(36).substring(2, 7)}`;
            }
            user = await UserModel.create({ email, user_name: finalUserName, avatar: picture });
            auth = await AuthModel.create({ userId: user._id, email, googleId });
        }

        const tokens = auth.getJWT(user.user_name, user.avatar);
        const metadata = { userAgent: req.headers["user-agent"], ip: req.ip };
        await authService.createSession(user._id as mongoose.Types.ObjectId, tokens.refreshToken, metadata);

        setAuthCookies(res, tokens);

        res.status(200).json({
            success: true,
            message: "Google Login successful",
            data: {
                user: { id: user._id, user_name: user.user_name, email: user.email, avatar: user.avatar },
            }
        });
    } catch (err) {
        // The client only gets a generic message, so keep the real reason in the server log.
        logger.error("Google sign-in failed:", err instanceof Error ? err.message : err);
        res.status(401).json({
            success: false,
            message: "Google authentication failed"
        });
    }
};
