// Resolve API URL dynamically:
// - Single project / single domain: backend API is hosted at the same origin (/api)
// - In browser: uses window.location.origin (e.g. https://omoo.web.id or http://localhost:4321)
// - In SSR: uses PUBLIC_SITE_URL or defaults to https://omoo.web.id
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SITE_URL) {
    return import.meta.env.PUBLIC_SITE_URL;
  }
  return 'https://omoo.web.id';
};

export const API_URL = getApiUrl();
export const API_BASE = `${API_URL}/api`;

export async function fetcher<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server');
  }
  return data;
}

export const api = {
  // Perfumes
  getPerfumes: (params?: { family?: string; availableOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.family) q.append('family', params.family);
    if (params?.availableOnly) q.append('availableOnly', 'true');
    return fetcher(`/perfumes?${q.toString()}`);
  },
  getPerfumeBySlug: (slug: string) => fetcher(`/perfumes/${slug}`),
  createPerfume: (data: any) => fetcher('/perfumes', { method: 'POST', body: JSON.stringify(data) }),
  updatePerfume: (id: string, data: any) => fetcher(`/perfumes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  togglePerfumeAvailability: (id: string, isAvailable: boolean) =>
    fetcher(`/perfumes/${id}/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) }),
  deletePerfume: (id: string) => fetcher(`/perfumes/${id}`, { method: 'DELETE' }),

  // Pages & Sections CMS
  getPages: () => fetcher('/pages'),
  getPage: (slug: string, all = false) => fetcher(`/pages/${slug}${all ? '?all=true' : ''}`),
  createPage: (data: any) => fetcher('/pages', { method: 'POST', body: JSON.stringify(data) }),
  updatePage: (id: string, data: any) => fetcher(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addSection: (pageId: string, data: any) => fetcher(`/pages/${pageId}/sections`, { method: 'POST', body: JSON.stringify(data) }),
  updateSection: (sectionId: string, data: any) => fetcher(`/pages/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderSections: (items: Array<{ id: string; order: number }>) =>
    fetcher('/pages/sections/reorder', { method: 'PATCH', body: JSON.stringify({ items }) }),
  deleteSection: (sectionId: string) => fetcher(`/pages/sections/${sectionId}`, { method: 'DELETE' }),
  syncHomeVisual: (sections: any) => fetcher('/pages/sync-home', { method: 'POST', body: JSON.stringify({ sections }) }),
  syncPageVisual: (data: { slug: string; elements?: any; images?: any; sections?: any; timeline?: any; hiddenSections?: string[] }) =>
    fetcher('/pages/sync-page', { method: 'POST', body: JSON.stringify(data) }),

  // Store & Atelier Global Settings
  getSettings: () => fetcher('/settings'),
  updateSettings: (data: any) => fetcher('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Users & Customer Data
  getUsers: (params?: { search?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    return fetcher(`/users?${q.toString()}`);
  },
  getUserDetail: (id: string) => fetcher(`/users/${id}`),
  createUser: (data: any) => fetcher('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => fetcher(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => fetcher(`/users/${id}`, { method: 'DELETE' }),

  // Orders & QRIS
  getOrders: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return fetcher(`/orders?${q.toString()}`);
  },
  trackOrder: (orderNumber: string) => fetcher(`/orders/track/${orderNumber}`),
  getMyOrders: (identifier: string, email?: string) => {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return fetcher(`/orders/my-orders/${encodeURIComponent(identifier)}${q}`);
  },
  createOrder: (data: any) => fetcher('/orders', { method: 'POST', body: JSON.stringify(data) }),
  uploadReceipt: (orderId: string, paymentProofUrl: string, paymentProofNote?: string) =>
    fetcher(`/orders/${orderId}/upload-receipt`, {
      method: 'POST',
      body: JSON.stringify({ paymentProofUrl, paymentProofNote }),
    }),
  validateOrderPayment: (orderId: string, validatedBy?: string, adminNotes?: string) =>
    fetcher(`/orders/${orderId}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({ validatedBy, adminNotes }),
    }),
  updateOrderStatus: (orderId: string, data: { status: string; trackingNumber?: string; shippingCourier?: string; adminNotes?: string }) =>
    fetcher(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateOrder: (orderId: string, data: any) =>
    fetcher(`/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOrder: (orderId: string) =>
    fetcher(`/orders/${orderId}`, { method: 'DELETE' }),
  createManualOrder: (data: any) => fetcher('/orders/manual', { method: 'POST', body: JSON.stringify(data) }),

  // Members & Loyalty
  getMyLoyalty: () => fetcher('/members/status'),
  getMembers: (tier?: string) => fetcher(`/members${tier ? `?tier=${encodeURIComponent(tier)}` : ''}`),
  updateMemberTier: (id: string, memberTier: 'Member' | 'Collector') =>
    fetcher(`/members/${id}/tier`, { method: 'PATCH', body: JSON.stringify({ memberTier }) }),
  getLoyaltyConfig: () => fetcher('/members/config'),
  updateLoyaltyConfig: (data: any) =>
    fetcher('/members/config', { method: 'PUT', body: JSON.stringify(data) }),

  // Gallery & Dokumentasi
  getGallery: (category?: string) => fetcher(`/gallery${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  createGalleryItem: (data: any) =>
    fetcher('/gallery', { method: 'POST', body: JSON.stringify(data) }),
  updateGalleryItem: (id: string, data: any) =>
    fetcher(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGalleryItem: (id: string) =>
    fetcher(`/gallery/${id}`, { method: 'DELETE' }),

  // Certifications
  getCertificates: (type?: string) => fetcher(`/certificates${type ? `?type=${type}` : ''}`),
  verifyCertificate: (verifyCode: string) => fetcher(`/certificates/verify/${verifyCode}`),
  createCertificate: (data: any) => fetcher('/certificates', { method: 'POST', body: JSON.stringify(data) }),
  updateCertificate: (id: string, data: any) => fetcher(`/certificates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCertificate: (id: string) => fetcher(`/certificates/${id}`, { method: 'DELETE' }),

  // Current User Session
  getMe: () => fetcher('/auth/me'),

  // Direct File Upload
  uploadFile: async (file: File, category: string = 'perfumes'): Promise<{ success: boolean; url: string; message?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
};
