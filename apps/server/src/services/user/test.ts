import { UserService } from './index';
import UserModel from '../../models/user';

jest.mock('../../models/user');

describe('UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService();
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return user profile if user exists', async () => {
            const mockUser = {
                _id: 'user123',
                user_name: 'testuser',
                email: 'test@example.com',
                avatar: 'avatar.png',
                bio: 'hello',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

            const result = await userService.getProfile('user123');
            expect(result.id).toBe('user123');
            expect(result.user_name).toBe('testuser');
        });

        it('should throw error if user not found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);
            await expect(userService.getProfile('user123')).rejects.toThrow('User not found');
        });
    });

    describe('updateProfile', () => {
        it('should update and return user if successful', async () => {
            const mockUpdatedUser = { _id: 'user123', user_name: 'newname' };
            (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser);

            const result = await userService.updateProfile('user123', { user_name: 'newname' });
            expect(result.user_name).toBe('newname');
        });

        it('should throw error if update fails', async () => {
            (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
            await expect(userService.updateProfile('user123', {})).rejects.toThrow('Failed to update profile');
        });
    });
});
