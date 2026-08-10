import api from './index';
import type { User } from './user';

export interface ActivityOrganizer {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Activity {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  images: string[];
  organizer: ActivityOrganizer;
  participants: User[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityData {
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  price: number;
  images?: string[];
  tags?: string[];
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export interface ActivityListResponse {
  success: boolean;
  data: {
    activities: Activity[];
    pagination: {
      current: number;
      total: number;
      count: number;
    };
  };
}

export const activityAPI = {
  // 获取活动列表
  getActivities: async (filters?: ActivityFilters): Promise<ActivityListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return api.get(`/activities?${params.toString()}`);
  },

  // 获取活动详情
  getActivityById: async (id: string): Promise<{ success: boolean; data: { activity: Activity } }> => {
    return api.get(`/activities/${id}`);
  },

  // 创建活动
  createActivity: async (data: CreateActivityData): Promise<{ success: boolean; message: string; data: { activity: Activity } }> => {
    return api.post('/activities', data);
  },

  // 更新活动
  updateActivity: async (id: string, data: Partial<CreateActivityData>): Promise<{ success: boolean; message: string; data: { activity: Activity } }> => {
    return api.put(`/activities/${id}`, data);
  },

  // 删除活动
  deleteActivity: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/activities/${id}`);
  },

  // 获取我创建的活动
  getMyActivities: async (filters?: Pick<ActivityFilters, 'page' | 'limit' | 'status'>): Promise<ActivityListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return api.get(`/activities/my/created?${params.toString()}`);
  },

  // 获取我参加的活动
  getJoinedActivities: async (filters?: Pick<ActivityFilters, 'page' | 'limit'>): Promise<ActivityListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return api.get(`/activities/my/joined?${params.toString()}`);
  },
};
