import mongoose, { model, Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import { signAccessToken, signRefreshToken } from '../../utils/authTokens';

export interface IAuth extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    email: string;
    password?: string;
    googleId?: string;
    getJWT(user_name: string, avatar?: string): { accessToken: string; refreshToken: string };
    comparePassword(password: string): Promise<boolean>;
}

const AuthSchema = new Schema<IAuth>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: function(this: IAuth) { return !this.googleId; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true 
    }
}, { timestamps: true })

/**
 * Generates both Access Token and Refresh Token.
 */
AuthSchema.methods.getJWT = function (user_name: string, avatar?: string) {
    const accessToken = signAccessToken({ _id: this.userId, user_name, avatar });
    const refreshToken = signRefreshToken({ _id: this.userId });

    return { accessToken, refreshToken };
};

/**
 * Instance method to compare password
 */
AuthSchema.methods.comparePassword = async function (password: string) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

const AuthModel = mongoose.models.Auth || model<IAuth>('Auth', AuthSchema);

export default AuthModel;
