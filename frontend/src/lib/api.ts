const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('clfs_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.errors?.[0]?.message || 'Request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; newPassword: string }) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Items
  getItems: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/items${query}`);
  },
  getItem: (id: string) => request(`/items/${id}`),
  getDashboardStats: () => request('/items/stats'),
  createLostItem: (data: FormData) => request('/items/lost', { method: 'POST', body: data }),
  createFoundItem: (data: FormData) => request('/items/found', { method: 'POST', body: data }),
  updateItem: (id: string, data: any) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id: string) => request(`/items/${id}`, { method: 'DELETE' }),
  updateItemStatus: (id: string, status: string) => request(`/items/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Matches
  getMatches: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/matches${query}`);
  },
  getMatch: (id: string) => request(`/matches/${id}`),
  getAllMatches: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/matches/all${query}`);
  },
  updateMatchStatus: (id: string, status: string) => request(`/matches/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Claims
  createClaim: (data: FormData) => request('/claims', { method: 'POST', body: data }),
  getMyClaims: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/claims${query}`);
  },
  getClaim: (id: string) => request(`/claims/${id}`),
  getAllClaims: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/claims/all${query}`);
  },
  updateClaimStatus: (id: string, data: any) => request(`/claims/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/notifications${query}`);
  },
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminUsers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/users${query}`);
  },
  updateUserStatus: (id: string, status: string) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateUserRole: (id: string, role: string) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  getAdminItems: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/items${query}`);
  },
  adminUpdateItemStatus: (id: string, status: string) => request(`/admin/items/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adminDeleteItem: (id: string) => request(`/admin/items/${id}`, { method: 'DELETE' }),
  getAdminClaims: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/claims${query}`);
  },
  getAdminReports: () => request('/admin/reports'),
};
