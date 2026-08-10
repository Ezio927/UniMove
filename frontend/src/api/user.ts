import api from './index';

export interface User {
  _id?: string;
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateProfileData {
  username?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const userAPI = {
  // 用户注册
  register: async (data: RegisterData): Promise<{ success: boolean; message: string; data: AuthResponse }> => {
    return api.post('/users/register', data);
  },

  // 用户登录
  login: async (data: LoginData): Promise<{ success: boolean; message: string; data: AuthResponse }> => {
    return api.post('/users/login', data);
  },

  // 获取当前用户信息
  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    return api.get('/users/profile');
  },

  // 更新用户信息
  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; message: string; data: { user: User } }> => {
    return api.put('/users/profile', data);
  },

  // 修改密码
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    return api.put('/users/password', data);
  },
};
