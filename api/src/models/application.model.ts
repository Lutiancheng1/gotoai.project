import mongoose, { Schema, Document } from 'mongoose';
import { Application } from '@/types';

export interface IApplicationDocument extends Omit<Application, 'id'>, Document {
  isApiKeyValid(): boolean;
}

const applicationSchema = new Schema<IApplicationDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  type: {
    type: String,
    required: true,
    enum: ['dify', 'ragflow', 'fastgpt']
  },
  apiKey: {
    type: String,
    required: true,
    trim: true
  },
  config: {
    type: Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 创建索引
applicationSchema.index({ name: 1 }, { unique: true });
applicationSchema.index({ type: 1 });
applicationSchema.index({ isActive: 1 });

// 验证API Key是否有效的方法
applicationSchema.methods.isApiKeyValid = function(): boolean {
  return Boolean(this.apiKey && this.isActive);
};

export const ApplicationModel = mongoose.model<IApplicationDocument>('Application', applicationSchema); 