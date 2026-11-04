import mongoose, { model, Schema } from 'mongoose'

export interface IUser extends mongoose.Document {
    user_name: string;
    email: string;
    avatar?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    user_name: {
        type: String,
        required: true,
        minLength: 3, 
        maxLength: 50,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    avatar: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        maxLength: 160,
        default: ""
    }
}, { timestamps: true })

const UserModel = mongoose.models.User || model<IUser>('User', UserSchema);

export default UserModel;

