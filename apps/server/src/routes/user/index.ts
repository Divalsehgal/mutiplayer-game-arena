import express from 'express'
import { getProfileHandler, updateProfileHandler } from '../../controllers/user'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate'
import { updateProfileSchema } from '@arena/shared'

const userRouter = express.Router()

/**
 * Protected Routes for User Profiles
 */
userRouter.get('/profile', authMiddleware, getProfileHandler)

// Update profile route with validation
userRouter.patch('/profile', authMiddleware, validate(updateProfileSchema), updateProfileHandler)

export default userRouter
