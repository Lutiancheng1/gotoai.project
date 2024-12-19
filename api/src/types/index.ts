import mongoose from 'mongoose';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  departments: Array<{
    _id: string;
    name: string;
  }>;
  isActive: boolean;
  canAccessAdmin: boolean;
  canAccessWeb: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  parentId: mongoose.Types.ObjectId | null;
  applications: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  name: string;
  type: 'dify' | 'ragflow' | 'fastgpt';
  apiKey: string;
  config?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}
