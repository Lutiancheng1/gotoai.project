import axios from 'axios';
import type {
  CreateSessionParams,
  UpdateSessionParams,
  ListSessionsParams,
  DeleteSessionsParams,
  SessionResponse,
  SessionListResponse,
  BaseResponse,
} from '@/types/ragflow';
import { stringify } from 'qs';

// 根据环境变量判断使用哪个 baseUrl
export const baseUrl = import.meta.env.MODE === 'development' 
  ? 'http://20.2.240.253'  // 开发环境
  : '/rag'                 // 生产环境

// 创建ragflow专用的axios实例
const ragflowAxios = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
ragflowAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Ragflow API error:', error.response?.data || error.message);
    // 确保返回一个带有错误信息的对象
    return Promise.reject({
      code: -1,
      message: error.response?.data?.message || error.message || '网络请求失败'
    });
  }
);

export class RagflowService {
  /**
   * 创建会话
   * @param chatId - 聊天助手ID
   * @param params - 创建会话参数
   */
  static async createSession(chatId: string, params: CreateSessionParams): Promise<SessionResponse> {
    const response = await ragflowAxios.post(`/api/v1/chats/${chatId}/sessions`, params);
    return response.data;
  }

  /**
   * 更新会话
   * @param chatId - 聊天助手ID
   * @param sessionId - 会话ID
   * @param params - 更新会话参数
   */
  static async updateSession(
    chatId: string,
    sessionId: string,
    params: UpdateSessionParams
  ): Promise<BaseResponse> {
    const response = await ragflowAxios.put(`/api/v1/chats/${chatId}/sessions/${sessionId}`, params);
    return response.data;
  }

  /**
   * 获取会话列表
   * @param chatId - 聊天助手ID
   * @param params - 查询参数
   */
  static async listSessions(chatId: string, params?: ListSessionsParams): Promise<SessionListResponse> {
    const queryString = params ? `?${stringify(params)}` : '';
    const response = await ragflowAxios.get(`/api/v1/chats/${chatId}/sessions${queryString}`);
    return response.data;
  }

  /**
   * 删除会话
   * @param chatId - 聊天助手ID
   * @param params - 删除会话参数
   */
  static async deleteSessions(chatId: string, params: DeleteSessionsParams): Promise<BaseResponse> {
    const response = await ragflowAxios.delete(`/api/v1/chats/${chatId}/sessions`, { data: params });
    return response.data;
  }

  /**
   * 删除所有会话
   * @param chatId - 聊天助手ID
   */
  static async deleteAllSessions(chatId: string): Promise<BaseResponse> {
    const response = await ragflowAxios.delete(`/api/v1/chats/${chatId}/sessions`);
    return response.data;
  }
} 

// 配置token的函数
export const configureRagflowToken = (token: string) => {
  if (token) {
    ragflowAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete ragflowAxios.defaults.headers.common['Authorization'];
  }
};

export default ragflowAxios;