import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { message } from 'antd';
import { Department } from './departments.slice';

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

interface LoginResponse {
  status: 'success';
  data: {
    user: AuthUser;
    token: string;
  }
}

interface FetchUserInfoResponse {
  status: 'success';
  data: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

// 格式化错误信息
const formatErrorMessage = (error: any): string => {
  if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
    return error.response.data.error.join(', ')
  }
  return error.response?.data?.message || '操作失败'
}

// 登录
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post<LoginResponse>('/api/auth/admin/login', credentials);
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { token, user };
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      return rejectWithValue(errorMessage);
    }
  }
);

// 获取用户信息
export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<FetchUserInfoResponse>('/api/auth/profile');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      return rejectWithValue(errorMessage);
    }
  }
);

// 登出
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } catch (error: any) {
      console.error('Logout error:', error);
      // 即使登出API调用失败，也清除本地存储
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      const errorMessage = formatErrorMessage(error)
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 登录
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        message.error(action.payload as string);
      });

    // 获取用户信息
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        message.error(action.payload as string);
        // 如果获取用户信息失败，可能是token过期，清除登录状态
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      });

    // 登出
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        message.error(action.payload as string);
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 