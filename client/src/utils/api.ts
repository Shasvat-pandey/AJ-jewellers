/**
 * Centralized API & Asset configuration.
 *
 * 1. Production: Uses `import.meta.env.VITE_API_BASE` if set (e.g. https://api.ajjewellers.in).
 * 2. Mobile / LAN Testing: If running on a local network IP (e.g. http://10.24.131.197:5173),
 *    dynamically connects to the same IP on port 5000 (e.g. http://10.24.131.197:5000).
 * 3. Local Desktop: Defaults to 'http://localhost:5000'.
 */

export const getApiBase = (): string => {
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }

  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
export const API_URL = `${API_BASE}/api`;

export const apiUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${clean}`;
};

/**
 * SEC-15: Standardized Auth Token & Request Helpers (Admin & Customer Separation)
 */
export const ADMIN_TOKEN_KEY = "aj_admin_token";
export const ADMIN_USER_KEY = "aj_admin_user";
export const CUSTOMER_TOKEN_KEY = "aj_jewellers_token";
export const CUSTOMER_USER_KEY = "aj_jewellers_user";

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const directAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (directAdminToken) return directAdminToken;

  try {
    const adminStored = localStorage.getItem(ADMIN_USER_KEY);
    if (adminStored) {
      const parsed = JSON.parse(adminStored);
      if (parsed?.token) return parsed.token;
    }
  } catch {
    // ignore JSON parsing issues
  }
  return null;
};

export const getCustomerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const directToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (directToken) return directToken;

  try {
    const userStored = localStorage.getItem(CUSTOMER_USER_KEY);
    if (userStored) {
      const parsed = JSON.parse(userStored);
      if (parsed?.token) return parsed.token;
    }
  } catch {
    // ignore JSON parsing issues
  }
  return null;
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  const isAdminContext = path.startsWith('/admin') || path.includes('admin');

  if (isAdminContext) {
    return getAdminToken() || getCustomerToken();
  }
  return getCustomerToken() || getAdminToken();
};

export const authHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {})
  };
};

export const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : apiUrl(endpoint);
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });
};
