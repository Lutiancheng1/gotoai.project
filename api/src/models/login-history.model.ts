import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginHistory extends Document {
  userId: string;
  username: string;
  loginType: 'admin' | 'web';
  ip: string;
  userAgent: string;
  location?: string;
  status: 'success' | 'failed';
  failReason?: string;
  createdAt: Date;
}

const loginHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  loginType: {
    type: String,
    enum: ['admin', 'web'],
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  location: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  failReason: String
}, {
  timestamps: true
});

// 索引
loginHistorySchema.index({ userId: 1 });
loginHistorySchema.index({ loginType: 1 });
loginHistorySchema.index({ status: 1 });
loginHistorySchema.index({ createdAt: 1 });
loginHistorySchema.index({ ip: 1 });

export const LoginHistoryModel = mongoose.model<ILoginHistory>('LoginHistory', loginHistorySchema); 