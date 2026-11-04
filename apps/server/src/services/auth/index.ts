import mongoose from "mongoose";

import bcrypt from "bcrypt";
import { SignupRequest, SigninRequest } from "../../dtos/auth.dto";
import UserModel from "../../models/user";
import AuthModel from "../../models/auth";
import SessionModel from "../../models/session";
import { hashToken, verifyRefreshToken } from "../../utils/authTokens";

export class AuthService {
    async signup(userData: SignupRequest, metadata?: { userAgent?: string, ip?: string }) {
        const { email, user_name, password } = userData;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check if user exists
            const usernameExists = await UserModel.findOne({ user_name }).session(session);
            if (usernameExists) throw new Error("Username is already taken");

            const emailExists = await AuthModel.findOne({ email }).session(session);
            if (emailExists) throw new Error("Email is already registered");

            // 1. Create User Profile
            const user = new UserModel({ email, user_name });
            await user.save({ session });

            // 2. Create Auth Credentials
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const auth = new AuthModel({
                userId: user._id,
                email,
                password: hashedPassword
            });
            await auth.save({ session });

            // 3. Generate Tokens
            const tokens = auth.getJWT(user.user_name, user.avatar);

            // 4. Store Session
            await this.createSession(user._id as mongoose.Types.ObjectId, tokens.refreshToken, metadata, session);

            await session.commitTransaction();
            return { user, tokens };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async signin(credentials: SigninRequest, metadata?: { userAgent?: string, ip?: string }) {
        const { email, password } = credentials;

        const auth = await AuthModel.findOne({ email });
        if (!auth) throw new Error("Invalid Credentials");

        const isPasswordValid = await auth.comparePassword(password);
        if (!isPasswordValid) throw new Error("Invalid Credentials");

        const user = await UserModel.findById(auth.userId);
        if (!user) throw new Error("User profile not found");

        const tokens = auth.getJWT(user.user_name, user.avatar);

        await this.createSession(user._id as mongoose.Types.ObjectId, tokens.refreshToken, metadata);

        return { user, tokens };
    }

    async createSession(userId: mongoose.Types.ObjectId, refreshToken: string, metadata?: { userAgent?: string, ip?: string }, session?: mongoose.ClientSession) {
        const userSession = new SessionModel({
            userId,
            refreshToken: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userAgent: metadata?.userAgent,
            ipAddress: metadata?.ip
        });
        await userSession.save({ session });
    }

    async refreshTokens(refreshToken: string) {
        try {
            const decoded = verifyRefreshToken<{ _id: string; user_name?: string }>(refreshToken);
            
            const auth = await AuthModel.findOne({ userId: decoded._id });
            if (!auth) throw new Error("Invalid auth record");

            const user = await UserModel.findById(auth.userId);
            if (!user) throw new Error("User profile not found");

            const tokens = auth.getJWT(user.user_name, user.avatar);

            // Rotate in one atomic step, so the same refresh token can only ever be spent once.
            const rotated = await SessionModel.findOneAndUpdate(
                { refreshToken: hashToken(refreshToken), userId: decoded._id },
                { refreshToken: hashToken(tokens.refreshToken), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            );
            if (!rotated) {
                // A validly signed token with no session was already used (or stolen): end every session.
                await SessionModel.deleteMany({ userId: decoded._id });
                throw new Error("Invalid or expired session");
            }

            return tokens;
        } catch (err) {
            const error = err as Error;
            throw new Error(error.message || "Invalid or expired refresh token");
        }
    }

    async logout(refreshToken: string) {
        await SessionModel.deleteOne({ refreshToken: hashToken(refreshToken) });
    }
}


