import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '@/utils/axios'
import { message } from 'antd'

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

// 分页响应类型
interface PaginationResponse {
  total: number
  page: number
  limit: number
  pages: number
}

// API 响应类型
interface ApplicationsResponse {
  status: string
  data: {
    applications: Application[]
    pagination: PaginationResponse
  }
}

interface ApplicationResponse {
  status: string
  data: {
    application: Application
  }
}

// API 错误响应类型
interface ApiErrorResponse {
  status: string
  message: string
  error: string[]
}

// 查询参数类型
interface FetchApplicationsParams {
  page?: number
  limit?: number
  search?: string
  type?: 'dify' | 'ragflow' | 'fastgpt'
  isActive?: boolean
}

// State 类型
interface ApplicationsState {
  applications: Application[]
  pagination: PaginationResponse
  loading: boolean
  error: string | null
}

const initialState: ApplicationsState = {
  applications: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  },
  loading: false,
  error: null
}

// 格式化错误信息
const formatErrorMessage = (error: any): string => {
  if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
    return error.response.data.error.join(', ')
  }
  return error.response?.data?.message || '操作失败'
}

// 获取应用列表
export const fetchApplications = createAsyncThunk(
  'applications/fetchApplications',
  async (params: FetchApplicationsParams, { rejectWithValue }) => {
    try {
      const response = await axios.get<ApplicationsResponse>('/api/admin/applications', {
        params
      })
      return response.data.data
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      message.error(errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

// 创建应用
export const createApplication = createAsyncThunk(
  'applications/createApplication',
  async (data: Partial<Application>, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApplicationResponse>('/api/admin/applications', data)
      message.success('创建应用成功')
      return response.data.data.application
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      message.error(errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

// 更新应用
export const updateApplication = createAsyncThunk(
  'applications/updateApplication',
  async ({ id, data }: { id: string; data: Partial<Application> }, { rejectWithValue }) => {
    try {
      const response = await axios.put<ApplicationResponse>(`/api/admin/applications/${id}`, data)
      message.success('更新应用成功')
      return response.data.data.application
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      message.error(errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

// 删除应用
export const deleteApplication = createAsyncThunk(
  'applications/deleteApplication',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/applications/${id}`)
      message.success('删除应用成功')
      return id
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error)
      message.error(errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // 获取应用列表
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false
        state.applications = action.payload.applications
        state.pagination = action.payload.pagination
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || '获取应用列表失败'
      })

    // 创建应用
    builder
      .addCase(createApplication.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.loading = false
        state.applications.unshift(action.payload)
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || '创建应用失败'
      })

    // 更新应用
    builder
      .addCase(updateApplication.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateApplication.fulfilled, (state, action) => {
        state.loading = false
        const index = state.applications.findIndex((app) => app._id === action.payload._id)
        if (index !== -1) {
          state.applications[index] = action.payload
        }
      })
      .addCase(updateApplication.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || '更新应用失败'
      })

    // 删除应用
    builder
      .addCase(deleteApplication.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.loading = false
        state.applications = state.applications.filter((app) => app._id !== action.payload)
      })
      .addCase(deleteApplication.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || '删除应用失败'
      })
  }
})

export default applicationsSlice.reducer 