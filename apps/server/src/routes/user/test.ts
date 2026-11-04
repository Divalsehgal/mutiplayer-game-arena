import request from 'supertest';
import express from 'express';
import userRouter from './index';
import * as userController from '../../controllers/user';
import { authMiddleware } from '../../middlewares/auth.middleware';

jest.mock('../../controllers/user', () => ({
    getProfileHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
    updateProfileHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../middlewares/auth.middleware', () => ({
    authMiddleware: jest.fn((req, res, next) => next()),
}));

describe('UserRoutes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/user', userRouter);
    });

    it('GET /user/profile should call getProfileHandler', async () => {
        const res = await request(app).get('/user/profile');
        expect(res.status).toBe(200);
        expect(userController.getProfileHandler).toHaveBeenCalled();
        expect(authMiddleware).toHaveBeenCalled();
    });

    it('PATCH /user/profile should call updateProfileHandler', async () => {
        const res = await request(app)
            .patch('/user/profile')
            .send({ user_name: 'newname' });
        
        expect(res.status).toBe(200);
        expect(userController.updateProfileHandler).toHaveBeenCalled();
    });
});
