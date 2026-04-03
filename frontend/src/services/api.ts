import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export interface ResponseModel<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  results: T[];
}

// --- Domain Types ---

export interface POI {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  status: 'ongoing' | 'completed';
  profile_image: string | null;
  is_deleted: boolean;
  created_at: string;
  stats?: {
    fulfilled: number;
    partial: number;
    unfulfilled: number;
    ongoing: number;
  };
}

export interface Claim {
  id: number;
  poi_id: number;
  description: string;
  status: 'fulfilled' | 'partial' | 'unfulfilled' | 'ongoing';
  confidence: number;
  ai_insight?: string;
  date_reported?: string;
  created_at: string;
  sources?: Source[];
  media?: Media[];
  poi?: POI;
}

export interface Source {
  id: number;
  claim_id: number;
  type: 'manifesto' | 'interview' | 'osint' | 'media';
  title: string;
  content: string | null;
  link: string | null;
  date: string | null;
  credibility_score: number;
  tags: string[];
}

export interface Media {
  id: number;
  claim_id: number | null;
  file_url: string;
  type: 'image' | 'pdf' | 'video' | 'audio';
  transcription_text?: string;
  transcription_status?: string;
}

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- API Methods ---

export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  const { data } = await api.post<ResponseModel<{
    access_token: string;
    token_type: string;
    user?: { id: number; email: string; name: string; role: 'user' | 'journalist' | 'admin'; status: 'active' | 'suspended' }
  }>>('/login/access-token', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return data;
};

export const getPOIs = async (skip = 0, limit = 100): Promise<POI[]> => {
  const { data } = await api.get<ResponseModel<PaginatedResponse<POI>>>(`/pois/?skip=${skip}&limit=${limit}`);
  return data.data.results;
};

export const getPOI = async (id: string | number): Promise<POI> => {
  const { data } = await api.get<ResponseModel<POI>>(`/pois/${id}`);
  return data.data;
};

export const getPOIFull = async (id: string | number): Promise<POI> => {
  const { data } = await api.get<ResponseModel<POI>>(`/pois/${id}/full`);
  return data.data;
};

export const createPOI = async (poiData: Partial<POI>): Promise<POI> => {
  const { data } = await api.post<ResponseModel<POI>>('/pois/', poiData);
  return data.data;
};

export const updatePOI = async (id: number, poiData: Partial<POI>): Promise<POI> => {
  const { data } = await api.put<ResponseModel<POI>>(`/pois/${id}`, poiData);
  return data.data;
};

export const deletePOI = async (id: number): Promise<POI> => {
  const { data } = await api.delete<ResponseModel<POI>>(`/pois/${id}`);
  return data.data;
};

export const getClaims = async (poiId?: string | number, skip = 0, limit = 100): Promise<Claim[]> => {
  const url = poiId ? `/claims/?poi_id=${poiId}&skip=${skip}&limit=${limit}` : `/claims/?skip=${skip}&limit=${limit}`;
  const { data } = await api.get<ResponseModel<PaginatedResponse<Claim>>>(url);
  return data.data.results;
};

export const getClaim = async (id: number): Promise<Claim> => {
  const { data } = await api.get<ResponseModel<Claim>>(`/claims/${id}`);
  return data.data;
};

export const createClaim = async (claimData: Partial<Claim>): Promise<Claim> => {
  const { data } = await api.post<ResponseModel<Claim>>('/claims/', claimData);
  return data.data;
};

export const updateClaim = async (id: number, claimData: Partial<Claim>): Promise<Claim> => {
  const { data } = await api.put<ResponseModel<Claim>>(`/claims/${id}`, claimData);
  return data.data;
};

export const deleteClaim = async (id: number): Promise<Claim> => {
  const { data } = await api.delete<ResponseModel<Claim>>(`/claims/${id}`);
  return data.data;
};

export const getSources = async (claimId?: number, skip = 0, limit = 100): Promise<Source[]> => {
  const url = claimId ? `/sources/?claim_id=${claimId}&skip=${skip}&limit=${limit}` : `/sources/?skip=${skip}&limit=${limit}`;
  const { data } = await api.get<ResponseModel<PaginatedResponse<Source>>>(url);
  return data.data.results;
};

export const createSource = async (sourceData: Partial<Source>): Promise<Source> => {
  const { data } = await api.post<ResponseModel<Source>>('/sources/', sourceData);
  return data.data;
};

export const updateSource = async (id: number, sourceData: Partial<Source>): Promise<Source> => {
  const { data } = await api.put<ResponseModel<Source>>(`/sources/${id}`, sourceData);
  return data.data;
};

export const deleteSource = async (id: number): Promise<Source> => {
  const { data } = await api.delete<ResponseModel<Source>>(`/sources/${id}`);
  return data.data;
};

export const uploadMedia = async (file: File, type: string, claimId?: number): Promise<Media> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (claimId) formData.append('claim_id', claimId.toString());
  const { data } = await api.post<ResponseModel<Media>>('/media/upload', formData);
  return data.data;
};

export const getStats = async () => {
  const { data } = await api.get<ResponseModel<Record<string, number>>>('/stats/claims');
  return data.data;
};

export const getRecentActivity = async (limit = 10) => {
  const { data } = await api.get<ResponseModel<any[]>>(`/stats/activity?limit=${limit}`);
  return data.data;
};

export const analyzeClaim = async (description: string, claimId: number) => {
  const { data } = await api.post<ResponseModel<any>>(`/claims/${claimId}/analyze`, { description });
  return data.data;
};

export const getMedia = async (id: number) => {
  const { data } = await api.get<ResponseModel<any>>(`/media/${id}`);
  return data.data;
};

export const getRecentMedia = async (limit = 20) => {
  const { data } = await api.get<ResponseModel<any[]>>(`/media/recent?limit=${limit}`);
  return data.data;
};

export const analyzeMedia = async (mediaId: number) => {
  const { data } = await api.post<ResponseModel<any>>(`/media/${mediaId}/analyze`);
  return data.data;
};

export const deleteMedia = async (mediaId: number) => {
  const { data } = await api.delete<ResponseModel<any>>(`/media/${mediaId}`);
  return data.data;
};

export const uploadPOIImage = async (poiId: number, file: File): Promise<POI> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ResponseModel<POI>>(`/pois/${poiId}/image`, formData);
  return data.data;
};

// --- Web Scraper (Synchronous in Lite version) ---

export interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
}

export const searchWeb = async (query: string, numResults = 10): Promise<SearchResult[]> => {
  const { data } = await api.post<ResponseModel<SearchResult[]>>(
    '/scraping/search',
    { query, num_results: numResults }
  );
  return data.data;
};

export interface ClaimItem {
  text: string;
  quote: string;
}

export interface ResearchResult {
  url: string;
  summary: string;
  claims: ClaimItem[];
  tone: string;
}

export const performResearch = async (url: string, focus_entity?: string): Promise<ResearchResult> => {
  const response = await api.post('/scraping/research', { url, focus_entity });
  return response.data.data;
};

// --- User Management (Admin) ---

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'journalist' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
}

export const getUsers = async (skip = 0, limit = 20, role?: string, status?: string): Promise<User[]> => {
  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  if (role) params.append('role', role);
  if (status) params.append('status', status);
  const { data } = await api.get<ResponseModel<User[]>>(`/users/?${params.toString()}`);
  return data.data;
};

export const getUser = async (userId: number): Promise<User> => {
  const { data } = await api.get<ResponseModel<User>>(`/users/${userId}`);
  return data.data;
};

export const createUser = async (userData: { email: string; name: string; password: string; role: 'user' | 'journalist' | 'admin' }): Promise<User> => {
  const { data } = await api.post<ResponseModel<User>>('/users/', userData);
  return data.data;
};

export const updateUser = async (userId: number, userData: Partial<User>): Promise<User> => {
  const { data } = await api.patch<ResponseModel<User>>(`/users/${userId}`, userData);
  return data.data;
};

export const deleteUser = async (userId: number): Promise<any> => {
  const { data } = await api.delete<ResponseModel<any>>(`/users/${userId}`);
  return data.data;
};

export const suspendUser = async (userId: number): Promise<User> => {
  const { data } = await api.post<ResponseModel<User>>(`/users/${userId}/suspend`, {});
  return data.data;
};

export const activateUser = async (userId: number): Promise<User> => {
  const { data } = await api.post<ResponseModel<User>>(`/users/${userId}/activate`, {});
  return data.data;
};

export const getJournalists = async (skip = 0, limit = 20): Promise<User[]> => {
  const { data } = await api.get<ResponseModel<User[]>>(`/users/journalists/?skip=${skip}&limit=${limit}`);
  return data.data;
};

export default api;
