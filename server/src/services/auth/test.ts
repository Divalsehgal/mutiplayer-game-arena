import mongoose from 'mongoose';
import { AuthService } from './index';
import AuthModel from '../../models/auth';
import UserModel from '../../models/user';
import SessionModel from '../../models/session';
import jwt from 'jsonwebtoken';
import { hashToken } from '../../utils/authTokens';

jest.mock('../../models/auth');
jest.mock('../../models/user');
jest.mock('../../models/session');
jest.mock('jsonwebtoken');
jest.mock('mongoose', () => {
    const mongoose = jest.requireActual('mongoose');
    return {
        ...mongoose,
        startSession: jest.fn().mockResolvedValue({
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        })
    };
});

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        jest.clearAllMocks();
    });

    it('should signin successfully', async () => {
        const mockAuth = {
            userId: 'user123',
            comparePassword: jest.fn().mockResolvedValue(true),
            getJWT: jest.fn().mockReturnValue({ accessToken: 'a', refreshToken: 'r' })
        };
        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        (UserModel.findById as jest.Mock).mockResolvedValue({ _id: 'user123', user_name: 'test' });

        const result = await authService.signin({ email: 'test@test.com', password: 'password' });
        expect(result.tokens.accessToken).toBe('a');
        expect(result.user.user_name).toBe('test');
    });

    it('should signup successfully', async () => {
        const mockQuery = {
            session: jest.fn().mockResolvedValue(null)
        };
        (UserModel.findOne as jest.Mock).mockReturnValue(mockQuery);
        (AuthModel.findOne as jest.Mock).mockReturnValue(mockQuery);
        
        // Mocking class instance creation and save
        const mockUserSave = jest.fn().mockResolvedValue({ _id: 'u1', user_name: 'u' });
        const mockAuthSave = jest.fn().mockResolvedValue({});
        const mockGetJWT = jest.fn().mockReturnValue({ accessToken: 'a', refreshToken: 'r' });

        (UserModel as any).mockImplementation(() => ({
            save: jest.fn().mockReturnValue({ session: mockUserSave }),
            _id: 'u1',
            user_name: 'u'
        }));

        (AuthModel as any).mockImplementation(() => ({
            save: jest.fn().mockReturnValue({ session: mockAuthSave }),
            getJWT: mockGetJWT,
            _id: 'a1'
        }));

        (SessionModel as any).mockImplementation(() => ({
            save: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue({}) })
        }));

        const result = await authService.signup({ email: 'n@n.com', user_name: 'u', password: 'p' });
        expect(result.tokens.accessToken).toBe('a');
    });

    it('should refresh tokens successfully', async () => {
        const mockTokens = { accessToken: 'a2', refreshToken: 'r2' };
        const mockAuth = {
            getJWT: jest.fn().mockReturnValue(mockTokens)
        };
        (jwt.verify as jest.Mock).mockReturnValue({ _id: 'u1' });
        (SessionModel.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 's1' });
        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        (UserModel.findById as jest.Mock).mockResolvedValue({ _id: 'u1', user_name: 'u' });

        const result = await authService.refreshTokens('old');
        expect(result.accessToken).toBe('a2');
        // Only digests are stored, and the swap is a single atomic update keyed on the old digest.
        expect(SessionModel.findOneAndUpdate).toHaveBeenCalledWith(
            { refreshToken: hashToken('old'), userId: 'u1' },
            expect.objectContaining({ refreshToken: hashToken('r2') })
        );
    });

    it('should throw error if user not found on signin', async () => {
        (AuthModel.findOne as jest.Mock).mockResolvedValue(null);
        await expect(authService.signin({ email: 'test@test.com', password: 'password' }))
            .rejects.toThrow('Invalid Credentials');
    });

    it('should throw error if password invalid', async () => {
        const mockAuth = {
            comparePassword: jest.fn().mockResolvedValue(false)
        };
        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        await expect(authService.signin({ email: 'test@test.com', password: 'wrong' }))
            .rejects.toThrow('Invalid Credentials');
    });

    it('should logout by deleting session', async () => {
        (SessionModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
        await authService.logout('token123');
        expect(SessionModel.deleteOne).toHaveBeenCalledWith({ refreshToken: hashToken('token123') });
    });

    it('should abort transaction and throw error on signup failure', async () => {
        const mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };
        (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

        (UserModel.findOne as jest.Mock).mockImplementation(() => {
            throw new Error('DB Error');
        });

        await expect(authService.signup({ email: 'n@n.com', user_name: 'u', password: 'p' }))
            .rejects.toThrow('DB Error');
        
        expect(mockSession.abortTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('ends every session of the user when a spent refresh token is reused', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ _id: 'u1' });
        (AuthModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1', getJWT: jest.fn().mockReturnValue({ accessToken: 'a', refreshToken: 'r' }) });
        (UserModel.findById as jest.Mock).mockResolvedValue({ _id: 'u1', user_name: 'u' });
        (SessionModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

        await expect(authService.refreshTokens('token'))
            .rejects.toThrow('Invalid or expired session');
        expect(SessionModel.deleteMany).toHaveBeenCalledWith({ userId: 'u1' });
    });

    it('should throw error if jwt verification fails on refresh', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('JWT expired');
        });

        await expect(authService.refreshTokens('token'))
            .rejects.toThrow('JWT expired');
    });

    it('should throw error if username taken on signup', async () => {
        const mockQuery = {
            session: jest.fn().mockResolvedValue({ user_name: 'taken' })
        };
        (UserModel.findOne as jest.Mock).mockReturnValue(mockQuery);
        
        await expect(authService.signup({ email: 'n@n.com', user_name: 'taken', password: 'p' }))
            .rejects.toThrow('Username is already taken');
    });

    it('should throw error if email registered on signup', async () => {
        const mockQueryNull = { session: jest.fn().mockResolvedValue(null) };
        const mockQueryEmail = { session: jest.fn().mockResolvedValue({ email: 'taken@test.com' }) };
        
        (UserModel.findOne as jest.Mock).mockReturnValue(mockQueryNull);
        (AuthModel.findOne as jest.Mock).mockReturnValue(mockQueryEmail);
        
        await expect(authService.signup({ email: 'taken@test.com', user_name: 'u', password: 'p' }))
            .rejects.toThrow('Email is already registered');
    });

    it('should throw error if user profile missing on signin', async () => {
        (AuthModel.findOne as jest.Mock).mockResolvedValue({ 
            userId: 'u1', 
            comparePassword: jest.fn().mockResolvedValue(true),
            getJWT: jest.fn().mockReturnValue({})
        });
        (UserModel.findById as jest.Mock).mockResolvedValue(null);
        await expect(authService.signin({ email: 't@t.com', password: 'p' }))
            .rejects.toThrow('User profile not found');
    });

    it('should throw error if auth record missing on refresh', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ _id: 'u1' });
        (SessionModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1' });
        (AuthModel.findOne as jest.Mock).mockResolvedValue(null);

        await expect(authService.refreshTokens('token'))
            .rejects.toThrow('Invalid auth record');
    });

    it('should throw error if user profile missing on refresh', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ _id: 'u1' });
        (SessionModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1' });
        (AuthModel.findOne as jest.Mock).mockResolvedValue({ userId: 'u1' });
        (UserModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(authService.refreshTokens('token'))
            .rejects.toThrow('User profile not found');
    });

    it('should throw generic error if something fails on refresh', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error(''); // Empty message
        });
        await expect(authService.refreshTokens('token'))
            .rejects.toThrow('Invalid or expired refresh token');
    });
});
