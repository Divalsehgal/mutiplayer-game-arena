import { tokenBucket } from "./safeHandler";

describe("tokenBucket", () => {
    it("allows a burst up to capacity, then refills over time", () => {
        let t = 0;
        const allow = tokenBucket(2, 60_000, () => t);
        expect([allow(), allow(), allow()]).toEqual([true, true, false]);
        t = 30_000; // half the window refills one token
        expect([allow(), allow()]).toEqual([true, false]);
    });
});
