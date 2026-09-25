process.env.CLIENT_ID = 'mock-client-id';
process.env.CLIENT_SECRET = 'mock-client-secret';

import { googleAuthHandler } from './index';
import AuthModel from '../../models/auth';
import UserModel from '../../models/user';
import { OAuth2Client } from 'google-auth-library';

jest.mock('../../services/auth');
jest.mock('../../models/auth');
jest.mock('../../models/user');

jest.mock('google-auth-library', () => {
    const mockVerify = jest.fn().mockResolvedValue({
        getPayload: () => ({ email: 'test@gmail.com', name: 'Test', sub: 'google123', picture: 'pic' })
    });
    return {
        OAuth2Client: jest.fn().mockImplementation(() => ({
            verifyIdToken: mockVerify
        }))
    };
});

describe('GoogleAuthController', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            body: {},
            headers: {},
            cookies: {},
            ip: '127.0.0.1'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should handle google sso login', async () => {
        mockReq.body.idToken = 'valid_token';
        const mockTokens = { accessToken: 'at', refreshToken: 'rt' };
        const mockAuth = { getJWT: jest.fn().mockReturnValue(mockTokens), save: jest.fn() };
        const mockUser = { _id: 'u1', user_name: 'Test', email: 'test@gmail.com', save: jest.fn() };

        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
        
        await googleAuthHandler(mockReq, mockRes);
        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle google sso error', async () => {
        mockReq.body.idToken = 'invalid';
        (AuthModel.findOne as jest.Mock).mockRejectedValue(new Error('Google error'));
        
        await googleAuthHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should return 400 if idToken is missing in googleAuth', async () => {
        mockReq.body.idToken = undefined;
        await googleAuthHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Google ID Token is required" }));
    });

    it('should return 401 if payload is missing email in googleAuth', async () => {
        mockReq.body.idToken = 'token';
        const mockVerify = (new OAuth2Client()).verifyIdToken;
        (mockVerify as jest.Mock).mockResolvedValueOnce({
            getPayload: () => ({ email: null })
        });
        
        await googleAuthHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid Google token payload" }));
    });

    it('should handle existing auth but missing user', async () => {
        mockReq.body.idToken = 'token';
        const mockAuth = { _id: 'a1', save: jest.fn(), getJWT: jest.fn().mockReturnValue({ accessToken: 'a', refreshToken: 'r' }) };
        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        (UserModel.findOne as jest.Mock).mockResolvedValue(null);
        (UserModel.create as jest.Mock).mockResolvedValue({ _id: 'u1', user_name: 'test', save: jest.fn() });
        
        await googleAuthHandler(mockReq, mockRes);
        expect(UserModel.create).toHaveBeenCalled();
        expect(mockAuth.save).toHaveBeenCalled();
    });

    it('should handle existing user but missing auth', async () => {
        mockReq.body.idToken = 'token';
        const mockUser = { _id: 'u1', user_name: 'test', save: jest.fn() };
        (AuthModel.findOne as jest.Mock).mockResolvedValue(null);
        (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
        (AuthModel.create as jest.Mock).mockResolvedValue({ getJWT: jest.fn().mockReturnValue({}), save: jest.fn() });
        
        await googleAuthHandler(mockReq, mockRes);
        expect(AuthModel.create).toHaveBeenCalled();
    });

    it('should update missing googleId and avatar on existing auth/user', async () => {
        mockReq.body.idToken = 'token';
        const mockUser = { _id: 'u1', user_name: 'test', avatar: null, save: jest.fn() };
        const mockAuth = { _id: 'a1', googleId: null, save: jest.fn(), getJWT: jest.fn().mockReturnValue({}) };
        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
        
        await googleAuthHandler(mockReq, mockRes);
        expect(mockAuth.googleId).toBe('google123');
        expect(mockUser.avatar).toBe('pic');
        expect(mockAuth.save).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('should fallback to email split for username if name missing', async () => {
        mockReq.body.idToken = 'token';
        const mockVerify = (new OAuth2Client()).verifyIdToken;
        (mockVerify as jest.Mock).mockResolvedValueOnce({
            getPayload: () => ({ email: 'no_name@test.com' }) // no name
        });
        
        (AuthModel.findOne as jest.Mock).mockResolvedValue(null);
        (UserModel.findOne as jest.Mock).mockResolvedValue(null);
        (UserModel.create as jest.Mock).mockResolvedValue({ _id: 'u1', user_name: 'no_name' });
        (AuthModel.create as jest.Mock).mockResolvedValue({ getJWT: jest.fn().mockReturnValue({}), save: jest.fn() });

        await googleAuthHandler(mockReq, mockRes);
        expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({ user_name: 'no_name' }));
    });

    it('should not update avatar if already exists', async () => {
        mockReq.body.idToken = 'token';
        const mockUser = { _id: 'u1', user_name: 'test', avatar: 'existing', save: jest.fn() };
        const mockAuth = { _id: 'a1', save: jest.fn(), getJWT: jest.fn().mockReturnValue({}) };
        (AuthModel.findOne as jest.Mock).mockResolvedValue(mockAuth);
        (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
        
        await googleAuthHandler(mockReq, mockRes);
        expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('should handle new user with username collision', async () => {
        mockReq.body.idToken = 'token';
        (AuthModel.findOne as jest.Mock).mockResolvedValue(null);
        (UserModel.findOne as jest.Mock)
            .mockResolvedValueOnce(null) // first findOne in googleAuthHandler
            .mockResolvedValueOnce({ user_name: 'Test' }); // findOne for username check
            
        (UserModel.create as jest.Mock).mockResolvedValue({ _id: 'u1', user_name: 'Test_123', save: jest.fn() });
        (AuthModel.create as jest.Mock).mockResolvedValue({ getJWT: jest.fn().mockReturnValue({}), save: jest.fn() });

        await googleAuthHandler(mockReq, mockRes);
        expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({ user_name: expect.stringMatching(/Test_/i) }));
    });

    it('should fail cleanly when Google OAuth credentials are not configured', async () => {
        const saved = { id: process.env.CLIENT_ID, secret: process.env.CLIENT_SECRET };
        delete process.env.CLIENT_ID;
        delete process.env.CLIENT_SECRET;
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        mockReq.body.idToken = 'valid_token';

        await googleAuthHandler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));

        process.env.CLIENT_ID = saved.id;
        process.env.CLIENT_SECRET = saved.secret;
    });

    it('logs the real reason when Google rejects the token', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockVerify = (new OAuth2Client()).verifyIdToken as jest.Mock;
        mockVerify.mockRejectedValueOnce(new Error('Wrong recipient, payload audience != requiredAudience'));
        mockReq.body.idToken = 'token_for_other_client';

        await googleAuthHandler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(errorSpy).toHaveBeenCalledWith('[ERROR]', 'Google sign-in failed:', 'Wrong recipient, payload audience != requiredAudience');
        errorSpy.mockRestore();
    });
});
