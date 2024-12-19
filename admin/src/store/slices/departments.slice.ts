import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { message } from 'antd';
import { Application } from './applications.slice';

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

interface DepartmentsState {
  departments: Department[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  departments: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async () => {
    try {
      const response = await axios.get('/api/admin/departments');
      return response.data.data.departments;
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取部门列表失败');
      throw error;
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (departmentData: Partial<Department>) => {
    try {
      const requestData = {
        name: departmentData.name,
        description: departmentData.description || '',
        parentId: departmentData.parentId || null,
        applications: departmentData.applications || []
      };
      
      const response = await axios.post('/api/admin/departments', requestData);
      message.success('部门创建成功');
      return response.data.data;
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建部门失败');
      throw error;
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ id, data }: { id: string; data: Partial<Department> }) => {
    try {
      const requestData = {
        name: data.name,
        description: data.description || '',
        parentId: data.parentId || null,
        applications: data.applications || []
      };
      
      const response = await axios.put(`/api/admin/departments/${id}`, requestData);
      message.success('部门更新成功');
      return response.data.data;
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新部门失败');
      throw error;
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async (id: string) => {
    try {
      await axios.delete(`/api/admin/departments/${id}`);
      message.success('部门删除成功');
      return id;
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除部门失败');
      throw error;
    }
  }
);

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch departments';
      })
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDepartment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDepartment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDepartment.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export default departmentsSlice.reducer; 