import mongoose, { Schema, Document } from 'mongoose';
import { Application } from '@/types';

export interface IApplicationDocument extends Omit<Application, 'id'>, Document {
  isApiKeyValid(): boolean;
}

const applicationSchema = new Schema<IApplicationDocument>({
  name: {
    type: String,
    required: true,
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
    type: Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  requestCount: {
    type: Number,
    default: 0
  },
  dailyLimit: {
    type: Number,
    default: 1000
  }
}, {
  timestamps: true
});

// 索引
applicationSchema.index({ name: 1 }, { unique: true });
applicationSchema.index({ type: 1 });
applicationSchema.index({ isActive: 1 });

// 验证API Key是否有效的方法
applicationSchema.methods.isApiKeyValid = function(): boolean {
  return Boolean(this.apiKey && this.isActive);
};

// 更新使用统计的方法
applicationSchema.methods.updateUsageStats = async function() {
  this.lastUsed = new Date();
  this.requestCount += 1;
  await this.save();
};

// 重置每日请求计数的静态方法
applicationSchema.statics.resetDailyRequestCounts = async function() {
  await this.updateMany({}, { requestCount: 0 });
};

export const ApplicationModel = mongoose.model<IApplicationDocument>('Application', applicationSchema); 