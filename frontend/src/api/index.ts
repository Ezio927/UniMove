import axios from 'axios';
import { ApiError } from './error';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.debug('API请求:', config.method?.toUpperCase(), config.url);
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.debug('API响应:', response.status, response.config.url);
    }
    return response.data;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API响应错误:', error.response?.status, error.message);
    }
    // 处理401错误（token过期）
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const responseData = error.response?.data as { message?: string } | undefined;
    return Promise.reject(new ApiError(
      responseData?.message || error.message || '请求失败',
      error.response?.status,
      responseData
    ));
  }
);

export default api;
