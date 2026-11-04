import { getProfileHandler, updateProfileHandler } from './index';
import { UserService } from '../../services/user';

jest.mock('../../services/user');

describe('UserController', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = { 
            user: { _id: 'u1' }, 
            body: {} 
        };
        mockRes = { 
            status: jest.fn().mockReturnThis(), 
            json: jest.fn() 
        };
        jest.clearAllMocks();
    });

    it('should get profile successfully', async () => {
        (UserService.prototype.getProfile as jest.Mock).mockResolvedValue({ user_name: 'test' });
        
        await getProfileHandler(mockReq, mockRes);
        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ 
            success: true,
            data: { user_name: 'test' } 
        }));
    });

    it('should handle profile not found', async () => {
        (UserService.prototype.getProfile as jest.Mock).mockRejectedValue(new Error('User not found'));
        
        await getProfileHandler(mockReq, mockRes);
        
        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should update profile successfully', async () => {
        mockReq.body = { user_name: 'new' };
        (UserService.prototype.updateProfile as jest.Mock).mockResolvedValue({ user_name: 'new' });
        
        await updateProfileHandler(mockReq, mockRes);
        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ 
            message: "Profile updated successfully" 
        }));
    });

    it('should return 401 if user not authenticated', async () => {
        mockReq.user = undefined;
        await getProfileHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if user not authenticated in updateProfile', async () => {
        mockReq.user = undefined;
        await updateProfileHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle update profile error', async () => {
        (UserService.prototype.updateProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));
        await updateProfileHandler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
    });
});

