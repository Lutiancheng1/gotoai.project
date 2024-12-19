import mongoose, { Schema, Document } from 'mongoose';
import { Department } from '@/types';

export interface IDepartmentDocument extends Omit<Department, 'id'>, Document {
  path: string; // 用于存储部门层级路径
  level: number; // 部门层级深度
}

const departmentSchema = new Schema<IDepartmentDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  path: {
    type: String,
    index: true
  },
  level: {
    type: Number,
    min: 1
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'Application'
  }]
}, {
  timestamps: true
});

// 索引
departmentSchema.index({ name: 1, parentId: 1 }, { unique: true });
departmentSchema.index({ path: 1 });
departmentSchema.index({ level: 1 });

// 中间件：创建或更新时设置path和level
departmentSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('parentId')) {
      if (!this.parentId) {
        this.path = this._id.toString();
        this.level = 1;
      } else {
        const parent = await DepartmentModel.findById(this.parentId);
        if (!parent) {
          throw new Error('Parent department not found');
        }
        this.path = `${parent.path},${this._id}`;
        this.level = parent.level + 1;
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// 删除前检查是否有子部门
departmentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const childrenCount = await DepartmentModel.countDocuments({ parentId: this._id });
  if (childrenCount > 0) {
    next(new Error('Cannot delete department with children'));
  }
  next();
});

export const DepartmentModel = mongoose.model<IDepartmentDocument>('Department', departmentSchema); 