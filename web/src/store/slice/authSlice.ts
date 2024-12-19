import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import ragflowAxios from '@/services/ragflow';
import { message } from 'antd';
import { getTokenInfo, removeTokenInfo, setTokenInfo } from '@/utils/storage';
 
// 应用类型定义
export interface Application {
  _id: string
  name: string
  type: 'dify' | 'ragflow' | 'fastgpt'
  apiKey: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 部门类型定义
export interface Department {
  _id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  path: string;
  level: number;
  applications?: Application[];
  children?: Department[];
}

// 用户类型定义
interface AuthUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  departments: Department[];
  isActive: boolean;
  canAccessAdmin: boolean;
  canAccessWeb: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface FetchUserInfoResponse {
  status: 'success';
  data: AuthUser;
}
const initialState: AuthState = {
  user: null,
  token: getTokenInfo(),
  loading: false,
  error: null,
};

// 格式化错误信息
const formatErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
    return error.response.data.error.join(', ');
  }
  return '操作失败';
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string;  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/web/login', {
        email: credentials.username,
        password: credentials.password,
      });
      const { token, user } = response.data.data;

      setTokenInfo(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // 配置Ragflow Token
      configureRagflowToken(user);
      return { token, user };
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout', 
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/logout');
      // 清除所有存储的 token
      removeTokenInfo();
      delete axios.defaults.headers.common['Authorization'];
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 获取用户信息
export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<FetchUserInfoResponse>('/auth/profile');
       // 配置Ragflow Token
      configureRagflowToken(response.data.data);
      return response.data.data;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      return rejectWithValue(errorMessage);
    }
  }
);

// 配置Ragflow Token的辅助函数
const configureRagflowToken = (user: AuthUser) => {
  // 遍历所有部门
  for (const dept of user.departments) {
    const configureFromDept = (department: Department) => {
      // 检查当前部门的应用
      const ragflowApp = department.applications?.find(app => app.type === 'ragflow');
      if (ragflowApp?.config?.token) {
        // 找到ragflow应用且有token，配置axios
        ragflowAxios.defaults.headers.common['Authorization'] = `Bearer ${ragflowApp.config.token}`;
        return true;
      }
      // 递归检查子部门
      if (department.children) {
        for (const childDept of department.children) {
          if (configureFromDept(childDept)) return true;
        }
      }
      return false;
    };
    
    if (configureFromDept(dept)) break;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
        state.loading = false;
        state.error = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
     // 获取用户信息
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        message.error(action.payload as string);
        // 如果获取用户信息失败，可能是token过期，清除登录状态
        state.user = null;
        state.token = null;
        removeTokenInfo()
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      });
  },
});

export const { clearError, toggleLoading } = authSlice.actions;
export default authSlice.reducer; 