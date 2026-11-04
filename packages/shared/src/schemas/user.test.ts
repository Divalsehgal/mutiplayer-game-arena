import { updateProfileSchema } from "./user";

describe("updateProfileSchema", () => {
    it("accepts https avatars and an empty string to clear it", () => {
        expect(updateProfileSchema.safeParse({ avatar: "https://cdn.example.com/a.png" }).success).toBe(true);
        expect(updateProfileSchema.safeParse({ avatar: "" }).success).toBe(true);
    });

    it.each(["http://example.com/a.png", "javascript:alert(1)", "data:image/png;base64,AAAA"])("rejects %s", (avatar) => {
        expect(updateProfileSchema.safeParse({ avatar }).success).toBe(false);
    });
});
