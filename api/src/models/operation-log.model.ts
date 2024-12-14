import mongoose, { Schema, Document } from 'mongoose';

export interface IOperationLog extends Document {
  userId: string;
  username: string;
  module: string;
  action: string;
  description: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  createdAt: Date;
}

const operationLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true,
    enum: ['user', 'department', 'application', 'auth', 'system']
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  ip: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
}, {
  timestamps: true
});

// 索引
operationLogSchema.index({ userId: 1 });
operationLogSchema.index({ module: 1 });
operationLogSchema.index({ action: 1 });
operationLogSchema.index({ createdAt: 1 });
operationLogSchema.index({ status: 1 });

export const OperationLogModel = mongoose.model<IOperationLog>('OperationLog', operationLogSchema); 