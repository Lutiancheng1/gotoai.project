import axios from 'axios';
import { message } from 'antd';
import { getTokenInfo, removeTokenInfo } from './storage';

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = getTokenInfo()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          // Handle unauthorized
          removeTokenInfo()
          delete instance.defaults.headers.common['Authorization'];
          // 只有在非登录页面才跳转
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          message.error('Access denied');
          break;
        case 404:
          message.error('Resource not found');
          break;
        case 500:
          message.error('Server error');
          break;
      }
    } else if (error.request) {
      message.error('Network error');
    } else {
      message.error('Request failed');
    }
    return Promise.reject(error);
  }
);

export default instance; 