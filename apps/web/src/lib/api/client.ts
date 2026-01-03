// Default to same-origin BFF proxy routes under /api/v1
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Request options
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'text' | 'blob';
}

/**
 * Create API client with automatic auth token injection
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, responseType, ...fetchOptions } = options;

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const basePath = API_PREFIX.endsWith('/') ? API_PREFIX.slice(0, -1) : API_PREFIX;

  // Build URL with query params
  const urlString = `${basePath}${normalizedEndpoint}`;
  const url = API_BASE_URL
    ? new URL(urlString, API_BASE_URL)
    : new URL(urlString, 'http://localhost');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const isFormDataBody = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

  // Build headers with auth token
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set JSON content type when sending JSON bodies
  if (!isFormDataBody && fetchOptions.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const wantsBlob = responseType === 'blob';
    const wantsText = responseType === 'text';

    const isJson = contentType?.includes('application/json') ?? false;

    if (wantsBlob) {
      if (!response.ok) {
        return { error: `Request failed with status ${response.status}` };
      }
      return { data: (await response.blob()) as unknown as T };
    }

    if (wantsText || !isJson) {
      const text = await response.text();
      if (!response.ok) {
        return { error: text || `Request failed with status ${response.status}` };
      }
      return { data: text as unknown as T };
    }

    // JSON
    const data = await response.json();
    if (!response.ok) {
      return { error: data.message || 'Request failed', message: data.message };
    }
    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error. Please try again.' };
  }
}

/**
 * API Client with typed methods for all endpoints
 */
export const api = {
  // Health check
  health: () => fetchWithAuth<{ status: string; timestamp: string }>('/health'),

  // Passengers
  passengers: {
    list: (params?: { page?: number; pageSize?: number; search?: string; status?: string }) =>
      fetchWithAuth<PaginatedResponse<any>>('/passengers', { params }),
    get: (id: string) => fetchWithAuth<any>(`/passengers/${id}`),
    create: (data: any) =>
      fetchWithAuth<any>('/passengers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth<any>(`/passengers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    checkIn: (id: string) => fetchWithAuth<any>(`/passengers/${id}/check-in`, { method: 'POST' }),
  },

  // Manifests
  manifests: {
    list: (params?: { page?: number; pageSize?: number; status?: string; sailingId?: string }) =>
      fetchWithAuth<PaginatedResponse<any>>('/passengers/manifests', { params }),
    get: (id: string) => fetchWithAuth<any>(`/passengers/manifests/${id}`),
    generate: (sailingId: string) =>
      fetchWithAuth<any>(`/passengers/manifests/generate/${sailingId}`, { method: 'POST' }),
    approve: (id: string) =>
      fetchWithAuth<any>(`/passengers/manifests/${id}/approve`, { method: 'POST' }),
    submit: (id: string) =>
      fetchWithAuth<any>(`/passengers/manifests/${id}/submit`, { method: 'POST' }),
  },

  // Crew
  crew: {
    list: (params?: { page?: number; pageSize?: number; search?: string; role?: string }) =>
      fetchWithAuth<PaginatedResponse<any>>('/crew', { params }),
    get: (id: string) => fetchWithAuth<any>(`/crew/${id}`),
    create: (data: any) =>
      fetchWithAuth<any>('/crew', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth<any>(`/crew/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    roster: (sailingId: string) => fetchWithAuth<any[]>(`/crew/roster/${sailingId}`),
  },

  // Certifications
  certifications: {
    list: (crewId?: string) =>
      fetchWithAuth<any[]>('/crew/certifications', { params: { crewId } }),
    get: (id: string) => fetchWithAuth<any>(`/crew/certifications/${id}`),
    create: (data: any) =>
      fetchWithAuth<any>('/crew/certifications', { method: 'POST', body: JSON.stringify(data) }),
    verify: (id: string) =>
      fetchWithAuth<any>(`/crew/certifications/${id}/verify`, { method: 'POST' }),
  },

  // Vessels
  vessels: {
    list: (params?: { page?: number; pageSize?: number; search?: string }) =>
      fetchWithAuth<PaginatedResponse<any>>('/vessels', { params }),
    get: (id: string) => fetchWithAuth<any>(`/vessels/${id}`),
    create: (data: any) =>
      fetchWithAuth<any>('/vessels', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth<any>(`/vessels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Vessel Documents
  documents: {
    list: (vesselId: string) => fetchWithAuth<any[]>(`/vessels/${vesselId}/documents`),
    upload: (vesselId: string, formData: FormData) =>
      fetchWithAuth<any>(`/vessels/${vesselId}/documents`, {
        method: 'POST',
        body: formData,
        // Let the browser set Content-Type boundary for FormData
      }),
  },

  // Compliance
  compliance: {
    dashboard: () => fetchWithAuth<any>('/compliance/dashboard'),
    export: (format: 'csv' | 'xml' | 'pdf', type: string, entityId: string) =>
      fetchWithAuth<Blob>(`/compliance/export/${format}/${type}/${entityId}`, {
        responseType: 'blob',
      }),
    jurisdictions: () => fetchWithAuth<any[]>('/compliance/jurisdictions'),
  },

  // Inspections
  inspections: {
    list: (params?: { vesselId?: string; status?: string }) =>
      fetchWithAuth<any[]>('/compliance/inspections', { params }),
    create: (data: any) =>
      fetchWithAuth<any>('/compliance/inspections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth<any>(`/compliance/inspections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Audit logs
  audit: {
    list: (params?: {
      page?: number;
      pageSize?: number;
      entityType?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }) => fetchWithAuth<PaginatedResponse<any>>('/audit', { params }),
  },
};

export default api;
