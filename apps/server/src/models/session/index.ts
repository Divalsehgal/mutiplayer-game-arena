import mongoose, { model, Schema } from 'mongoose'

export interface ISession extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    refreshToken: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    refreshToken: {
        type: String,
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: MongoDB will auto-delete expired sessions
    },
    userAgent: {
        type: String
    },
    ipAddress: {
        type: String
    }
}, { timestamps: true })

const SessionModel = mongoose.models.Session || model<ISession>('Session', SessionSchema);

export default SessionModel;
