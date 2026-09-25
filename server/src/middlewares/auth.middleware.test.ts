import { authMiddleware } from './auth.middleware';
import jwt from 'jsonwebtoken';
import AuthModel from '../models/auth';

jest.mock('jsonwebtoken');
jest.mock('../models/auth');

describe('authMiddleware', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        req = {
            cookies: {},
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should return 401 if no token provided', async () => {
        await authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized: No token provided' }));
    });

    it('should call next if token is valid and session exists', async () => {
        req.cookies.access_token = 'valid_token';
        const decoded = { _id: 'user123', user_name: 'test' };
        (jwt.verify as jest.Mock).mockReturnValue(decoded);
        (AuthModel.findOne as jest.Mock).mockResolvedValue({ userId: 'user123' });

        await authMiddleware(req, res, next);

        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        req.cookies.access_token = 'invalid_token';
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized: Invalid or expired token' }));
    });

    it('should return 401 if the session no longer exists', async () => {
        req.cookies.access_token = 'valid_token';
        (jwt.verify as jest.Mock).mockReturnValue({ _id: 'user123', user_name: 'test' });
        (AuthModel.findOne as jest.Mock).mockResolvedValue(null);

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized: Invalid session' }));
        expect(next).not.toHaveBeenCalled();
    });
});
