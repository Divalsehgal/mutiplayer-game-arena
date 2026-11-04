import { Request, Response, NextFunction } from "express"
import { AuthService } from "../../services/auth"
import { SignupRequest, SigninRequest } from "../../dtos/auth.dto";
import { clearAuthCookies, setAuthCookies } from "./helpers";
import { logger } from "../../utils/logger";

export * from "./GoogleAuthController";

const authService = new AuthService();

export const signinHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const credentials: SigninRequest = req.body;
        const metadata = { userAgent: req.headers["user-agent"], ip: req.ip };
        const { user, tokens } = await authService.signin(credentials, metadata);

        setAuthCookies(res, tokens);

        res.status(200).json({ 
            success: true,
            data: { user: { id: user.id || (user as { _id?: string })._id, user_name: user.user_name, email: user.email, avatar: user.avatar } }
        });
    } catch (err) {
        const error = err as Error;
        if (error.message === "Invalid Credentials") {
            return res.status(401).json({ success: false, message: error.message });
        }
        logger.error("Sign-in failed:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

export const signupHandler = async (req: Request, res: Response) => {
    try {
        const userData: SignupRequest = req.body;
        const metadata = { userAgent: req.headers["user-agent"], ip: req.ip };
        const { user, tokens } = await authService.signup(userData, metadata);

        setAuthCookies(res, tokens);

        res.status(201).json({ 
            success: true, 
            message: "User registered successfully",
            data: { 
                user: { id: user.id || (user as { _id?: string })._id, user_name: user.user_name, email: user.email, avatar: user.avatar },
            }
        });
    } catch (err) {
        // Don't reveal which accounts exist or why the database said no.
        logger.error("Sign-up failed:", err);
        res.status(400).json({ success: false, message: "Couldn't create the account" });
    }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (typeof refreshToken !== "string" || !refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token missing" });
        }
        const tokens = await authService.refreshTokens(refreshToken);
        setAuthCookies(res, tokens);
        res.status(200).json({ 
            success: true
        });
    } catch (err) {
        logger.error("Token refresh failed:", err);
        res.status(401).json({ success: false, message: "Invalid or expired session" });
    }
};

export const logoutHandler = async (req: Request, res: Response) => {
    try {
        // Cookies can carry JSON objects ("j:{...}"), so only a plain string may reach the query.
        const refreshToken = req.cookies.refresh_token;
        if (typeof refreshToken === "string" && refreshToken) {
            await authService.logout(refreshToken);
        }
    } catch (err) {
        logger.error("Logout failed to remove the session:", err);
    }
    // Always sign the browser out, even if the session row couldn't be removed.
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: "Logged out successfully" });
};
