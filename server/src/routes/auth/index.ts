import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { signinHandler, signupHandler, logoutHandler, refreshTokenHandler, googleAuthHandler } from '../../controllers/auth'
import { validate } from '../../middlewares/validate'
import { signupSchema, signinSchema, logoutSchema, refreshTokenSchema, googleAuthSchema } from '../../validators/auth.validator'

const authRouter = express.Router()

// Slows down password guessing and account spam: 20 requests per 15 minutes per IP, shared across these routes.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
})

// Authentication Routes
authRouter.post('/signup', authLimiter, validate(signupSchema), signupHandler)
authRouter.post('/signin', authLimiter, validate(signinSchema), signinHandler)
authRouter.post('/google', authLimiter, validate(googleAuthSchema), googleAuthHandler) 
authRouter.post('/logout', validate(logoutSchema), logoutHandler)
authRouter.post('/refresh', authLimiter, validate(refreshTokenSchema), refreshTokenHandler)

export default authRouter
