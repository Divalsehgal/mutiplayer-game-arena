import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Middleware to validate request body using a Zod schema.
 * Automatically sends a 400 response if validation fails.
 */
export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Parse the request body against the schema
            const validatedData = await schema.parseAsync(req.body);
            
            // Replace req.body with the validated/transformed data (handles trim, lowercase, etc.)
            req.body = validatedData;
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Return structured error messages
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            
            // Pass any other errors to global error handler
            next(error);
        }
    };
};
