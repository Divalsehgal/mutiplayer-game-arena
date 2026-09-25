import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import AuthModel from './index';

jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('AuthModel', () => {
    it('should generate JWT tokens correctly', () => {
        const auth = new AuthModel({
            userId: new mongoose.Types.ObjectId(),
            email: 'test@test.com'
        });

        (jwt.sign as jest.Mock).mockReturnValue('mock_token');

        const tokens = auth.getJWT('testuser');
        
        expect(tokens.accessToken).toBe('mock_token');
        expect(tokens.refreshToken).toBe('mock_token');
        expect(jwt.sign).toHaveBeenCalled();
    });

    it('should compare password correctly', async () => {
        const auth = new AuthModel({
            userId: new mongoose.Types.ObjectId(),
            email: 'test@test.com',
            password: 'hashed_password'
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const isValid = await auth.comparePassword('plain_password');
        expect(isValid).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith('plain_password', 'hashed_password');
    });

    it('should return false for comparePassword if no password exists', async () => {
        const auth = new AuthModel({
            userId: new mongoose.Types.ObjectId(),
            email: 'test@test.com'
        });

        const isValid = await auth.comparePassword('any');
        expect(isValid).toBe(false);
    });

    it('should require a password unless the account uses Google sign-in', () => {
        const emailAccount = new AuthModel({ userId: new mongoose.Types.ObjectId(), email: 'a@test.com' });
        expect(emailAccount.validateSync()?.errors.password).toBeDefined();

        const googleAccount = new AuthModel({ userId: new mongoose.Types.ObjectId(), email: 'b@test.com', googleId: 'g1' });
        expect(googleAccount.validateSync()?.errors.password).toBeUndefined();
    });
});
