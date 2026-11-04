import { z } from "zod";

/**
 * Zod schema for Updating User Profile
 */
export const updateProfileSchema = z.object({
    avatar: z.string()
        .url("Invalid avatar URL format")
        .startsWith("https://", "Avatar URL must use https://")
        .optional()
        .or(z.literal("")), // Allow empty string to remove avatar
    bio: z.string()
        .max(160, "Bio must be at most 160 characters")
        .optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
