import axios from 'axios';
import type { ApiResponse, AuthResponse, Match, Team, TeamFollow, AIInsight } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      name,
    });
    return data.data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return data.data;
  },

  getMe: async () => {
    const { data } = await api.get<ApiResponse<any>>('/auth/me');
    return data.data;
  },
};

// Matches API
export const matchesAPI = {
  getMatches: async (filters?: {
    league?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.league) params.append('league', filters.league.toString());
    if (filters?.date) params.append('date', filters.date);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const { data } = await api.get<ApiResponse<Match[]> & { pagination?: any }>(`/matches?${params}`);
    return {
      matches: data.data,
      pagination: data.pagination,
    };
  },

  getLiveMatches: async (league?: number, date?: string) => {
    const params = new URLSearchParams();
    if (league) params.append('league', league.toString());
    if (date) params.append('date', date);

    const { data } = await api.get<ApiResponse<Match[]>>(`/matches/live?${params}`);
    return data.data;
  },

  getMatchById: async (id: number) => {
    const { data } = await api.get<ApiResponse<Match>>(`/matches/${id}`);
    return data.data;
  },

  getMatchInsights: async (id: number) => {
    const { data} = await api.get<ApiResponse<AIInsight[]>>(`/matches/${id}/insights`);
    return data.data;
  },

  generateInsight: async (
    id: number,
    type: 'pre_match' | 'halftime' | 'post_match',
    deepAnalysis = false
  ) => {
    const { data } = await api.post<ApiResponse<AIInsight>>(`/matches/${id}/insights`, {
      type,
      deepAnalysis,
    });
    return data.data;
  },

  syncToday: async () => {
    const { data } = await api.post<ApiResponse<Match[]>>('/matches/sync');
    return data.data;
  },

  syncDateRange: async (dateFrom: string, dateTo: string) => {
    const { data } = await api.post<ApiResponse<Match[]>>('/matches/sync/range', {
      dateFrom,
      dateTo,
    });
    return data.data;
  },
};

// Teams API
export const teamsAPI = {
  searchTeams: async (query: string) => {
    const { data } = await api.get<ApiResponse<Team[]>>(`/teams/search?q=${query}`);
    return data.data;
  },

  followTeam: async (id: number, preferences?: {
    notifyMatchStart?: boolean;
    notifyGoals?: boolean;
    notifyFinalScore?: boolean;
  }) => {
    const { data } = await api.post<ApiResponse<TeamFollow>>(`/teams/${id}/follow`, preferences);
    return data.data;
  },

  unfollowTeam: async (id: number) => {
    const { data } = await api.delete<ApiResponse<{ success: boolean }>>(`/teams/${id}/follow`);
    return data.data;
  },
};

// Users API
export const usersAPI = {
  getFollowedTeams: async () => {
    const { data } = await api.get<ApiResponse<TeamFollow[]>>('/users/me/following');
    return data.data;
  },
};

export default api;
