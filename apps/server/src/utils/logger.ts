export const logger = {
    info: (...msg: unknown[]) => console.log("[INFO]", ...msg),
    warn: (...msg: unknown[]) => console.warn("[WARN]", ...msg),
    error: (...msg: unknown[]) => console.error("[ERROR]", ...msg),
};
