import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { message } from 'antd';

export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
  departments: {
    _id: string;
    name: string;
  }[];
  isActive: boolean;
  canAccessAdmin: boolean;
  canAccessWeb: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsersState {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface ApiErrorResponse {
  status: string;
  message: string;
  error: string[];
}

const initialState: UsersState = {
  users: [],
  total: 0,
  loading: false,
  error: null,
};

// 格式化错误信息
const formatErrorMessage = (error: any): string => {
  if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
    return error.response.data.error.join(', ');
  }
  return error.response?.data?.message || '操作失败';
};

// 获取用户列表
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ 
    page, 
    limit,
    search,
    role,
    isActive,
    departmentId 
  }: { 
    page: number; 
    limit: number;
    search?: string;
    role?: 'admin' | 'user';
    isActive?: boolean;
    departmentId?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/users', {
        params: { 
          page, 
          limit,
          search,
          role,
          isActive,
          departmentId
        },
      });
      return response.data.data;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 获取所有用户（无分页）
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async ({ 
    search,
    role,
    isActive,
    departmentId 
  }: { 
    search?: string;
    role?: 'admin' | 'user';
    isActive?: boolean;
    departmentId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/users/all', {
        params: { 
          search,
          role,
          isActive,
          departmentId
        },
      });
      return response.data.data;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 创建用户
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/users', userData);
      message.success('用户创建成功');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 更新用户
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id: string; data: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/users/' + id, data);
      message.success('用户更新成功');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 删除用户
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete('/api/admin/users/' + id);
      message.success('用户删除成功');
      return id;
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取用户列表（分页）
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 获取所有用户（无分页）
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.users.length;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 创建用户
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 更新用户
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 删除用户
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer; 