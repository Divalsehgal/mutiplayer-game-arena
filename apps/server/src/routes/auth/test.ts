import request from 'supertest';
import express from 'express';
import authRouter from './index';
import * as authController from '../../controllers/auth';

jest.mock('../../controllers/auth', () => ({
    signupHandler: jest.fn((req, res) => res.status(201).json({ success: true })),
    signinHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
    googleAuthHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
    logoutHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
    refreshTokenHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

describe('AuthRoutes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/auth', authRouter);
    });

    it('POST /auth/signup should call signupHandler', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({ email: 'test@test.com', user_name: 'testuser', password: 'Password123!' });
        
        expect(res.status).toBe(201);
        expect(authController.signupHandler).toHaveBeenCalled();
    });

    it('POST /auth/signin should call signinHandler', async () => {
        const res = await request(app)
            .post('/auth/signin')
            .send({ email: 'test@test.com', password: 'Password123!' });
        
        expect(res.status).toBe(200);
        expect(authController.signinHandler).toHaveBeenCalled();
    });

    it('POST /auth/google should call googleAuthHandler', async () => {
        const res = await request(app)
            .post('/auth/google')
            .send({ idToken: 'some-token' });
        
        expect(res.status).toBe(200);
        expect(authController.googleAuthHandler).toHaveBeenCalled();
    });

    it('POST /auth/logout should call logoutHandler', async () => {
        const res = await request(app)
            .post('/auth/logout')
            .send({ refreshToken: 'some-token' });
        
        expect(res.status).toBe(200);
        expect(authController.logoutHandler).toHaveBeenCalled();
    });

    it('POST /auth/refresh should call refreshTokenHandler', async () => {
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: 'some-token' });
        
        expect(res.status).toBe(200);
        expect(authController.refreshTokenHandler).toHaveBeenCalled();
    });

    it('rate limits the credential routes per IP but never logout', async () => {
        for (let i = 0; i < 20; i++) await request(app).post('/auth/refresh').send({});
        const limited = await request(app).post('/auth/signin').send({ email: 'test@test.com', password: 'x' });
        expect(limited.status).toBe(429);

        const logout = await request(app).post('/auth/logout').send({});
        expect(logout.status).toBe(200);
    });
});
