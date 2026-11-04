import { z } from "zod";

/**
 * Zod schema for User Signup validation
 */
export const signupSchema = z.object({
    user_name: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be at most 50 characters")
        .trim(),
    email: z.string()
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
});

/**
 * Zod schema for User Signin validation
 */
export const signinSchema = z.object({
    email: z.string()
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z.string()
        .min(1, "Password is required")
});

/**
 * Zod schema for Google SSO Login
 */
export const googleAuthSchema = z.object({
    idToken: z.string().min(1, "Google ID Token is required")
});

/**
 * Zod schema for Refresh Token
 */
export const refreshTokenSchema = z.object({});

/**
 * Zod schema for Logout
 */
export const logoutSchema = z.object({});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
