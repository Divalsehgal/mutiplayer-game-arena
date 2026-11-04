import { validate } from './validate';
import { z } from 'zod';

describe('validate middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
    });

    beforeEach(() => {
        mockReq = {
            body: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    it('should call next() if validation passes', async () => {
        mockReq.body = { name: 'John Doe', email: 'john@example.com' };
        const middleware = validate(schema);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
        mockReq.body = { name: 'Jo', email: 'invalid-email' };
        const middleware = validate(schema);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Validation failed',
                errors: expect.arrayContaining([
                    expect.objectContaining({ path: 'name' }),
                    expect.objectContaining({ path: 'email' }),
                ]),
            })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass non-Zod errors to next()', async () => {
        const failingSchema = {
            parseAsync: jest.fn().mockRejectedValue(new Error('Internal error')),
        };

        const middleware = validate(failingSchema as any);
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
});
