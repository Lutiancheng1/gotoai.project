import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
});

// 从localStorage获取token并设置认证头
const token = localStorage.getItem('token');
if (token) {
  instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 如果收到401响应，清除token并重定向到登录页
      localStorage.removeItem('token');
      delete instance.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance; 