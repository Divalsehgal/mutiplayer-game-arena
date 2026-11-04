import { signupSchema, signinSchema } from './auth';

describe('Auth Validator', () => {
    describe('signupSchema', () => {
        it('should validate a correct signup object', () => {
            const validData = {
                user_name: 'johndoe',
                email: 'john@example.com',
                password: 'Password123'
            };
            const result = signupSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail if user_name is too short', () => {
            const invalidData = {
                user_name: 'jo',
                email: 'john@example.com',
                password: 'Password123'
            };
            const result = signupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toBe('Username must be at least 3 characters');
            }
        });

        it('should fail if email is invalid', () => {
            const invalidData = {
                user_name: 'johndoe',
                email: 'invalid-email',
                password: 'Password123'
            };
            const result = signupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should fail if password is too short', () => {
            const invalidData = {
                user_name: 'johndoe',
                email: 'john@example.com',
                password: 'Pass1'
            };
            const result = signupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('signinSchema', () => {
        it('should validate a correct signin object', () => {
            const validData = {
                email: 'john@example.com',
                password: 'Password123'
            };
            const result = signinSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail if email is missing', () => {
            const invalidData = {
                password: 'Password123'
            };
            const result = signinSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
