import { signinHandler, signupHandler, logoutHandler, refreshTokenHandler } from './index';
import { AuthService } from '../../services/auth';

jest.mock('../../services/auth');
jest.mock('../../models/auth');
jest.mock('../../models/user');

describe('AuthController', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

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
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('should signin and set cookies', async () => {
        const mockUser = { _id: 'u1', user_name: 'testuser', email: 'test@example.com' };
        const mockTokens = { accessToken: 'at', refreshToken: 'rt' };
        (AuthService.prototype.signin as jest.Mock).mockResolvedValue({ user: mockUser, tokens: mockTokens });
        
        await signinHandler(mockReq, mockRes, mockNext);
        
        expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'at', expect.any(Object));
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    id: 'u1',
                    user_name: 'testuser',
                    email: 'test@example.com'
                })
            })
        }));
        expect(mockRes.json).not.toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ accessToken: expect.any(String) })
        }));
    });

    it('should handle signin error', async () => {
        (AuthService.prototype.signin as jest.Mock).mockRejectedValue(new Error('Invalid Credentials'));
        
        await signinHandler(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should handle token refresh', async () => {
        mockReq.cookies.refresh_token = 'old_rt';
        const mockTokens = { accessToken: 'new_at', refreshToken: 'new_rt' };
        (AuthService.prototype.refreshTokens as jest.Mock).mockResolvedValue(mockTokens);
        
        await refreshTokenHandler(mockReq, mockRes);
        
        expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'new_at', expect.any(Object));
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should logout and clear cookies', async () => {
        mockReq.cookies.refresh_token = 'token';
        
        await logoutHandler(mockReq, mockRes);
        
        expect(AuthService.prototype.logout).toHaveBeenCalledWith('token');
        expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
        expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should ignore a non-string refresh cookie on logout (NoSQL operator injection)', async () => {
        mockReq.cookies.refresh_token = { $ne: null };

        await logoutHandler(mockReq, mockRes);

        expect(AuthService.prototype.logout).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should still sign the browser out if removing the session fails', async () => {
        mockReq.cookies.refresh_token = 'token';
        (AuthService.prototype.logout as jest.Mock).mockRejectedValueOnce(new Error('db down'));

        await logoutHandler(mockReq, mockRes);

        expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should fail refresh if token missing', async () => {
        mockReq.cookies.refresh_token = undefined;
        await refreshTokenHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Refresh token missing" }));
    });

    it('should handle refresh token error', async () => {
        mockReq.cookies.refresh_token = 'token';
        (AuthService.prototype.refreshTokens as jest.Mock).mockRejectedValue(new Error('Refresh failed'));
        
        await refreshTokenHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    describe('signupHandler', () => {
        it('should register a new user successfully', async () => {
            const mockUser = { _id: 'u1', user_name: 'testuser', email: 'test@example.com' };
            const mockTokens = { accessToken: 'at', refreshToken: 'rt' };
            (AuthService.prototype.signup as jest.Mock).mockResolvedValue({ user: mockUser, tokens: mockTokens });
            
            mockReq.body = { user_name: 'testuser', email: 'test@example.com', password: 'password123' };
            
            await signupHandler(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "User registered successfully"
            }));
            expect(mockRes.json).not.toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ refreshToken: expect.any(String) })
            }));
            expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'at', expect.any(Object));
        });

        it('should handle signup error', async () => {
            (AuthService.prototype.signup as jest.Mock).mockRejectedValue(new Error('User already exists'));
            
            await signupHandler(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(400);
            // Generic on purpose: don't reveal which emails/usernames exist.
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: "Couldn't create the account"
            });
        });
    });
});
