import { API_BASE_URL } from './config';
import { tokenStorage } from './tokenStorage';
import { ApiResponse, ApiErrorPayload } from '../../types';

export class ApiError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: Record<string, any>;
  public isUnauthorized: boolean;
  public isNetworkError: boolean;

  constructor(payload: {
    message: string;
    statusCode: number;
    code?: string;
    details?: Record<string, any>;
    isUnauthorized?: boolean;
    isNetworkError?: boolean;
  }) {
    super(payload.message);
    this.name = 'ApiError';
    this.statusCode = payload.statusCode;
    this.code = payload.code;
    this.details = payload.details;
    this.isUnauthorized = payload.isUnauthorized ?? payload.statusCode === 401;
    this.isNetworkError = payload.isNetworkError ?? false;
  }
}

type UnauthorizedHandler = () => void;
const unauthorizedListeners: Set<UnauthorizedHandler> = new Set();

export const onUnauthorized = (listener: UnauthorizedHandler): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Build headers
  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  if (!skipAuth) {
    const token = tokenStorage.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 204 No Content or empty responses
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let responseData: any = null;
    if (isJson) {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
    } else {
      responseData = await response.text();
    }

    if (contentType.includes('text/html') || (typeof responseData === 'string' && responseData.trim().startsWith('<'))) {
      throw new ApiError({
        message: `Expected JSON API response but received HTML document from ${url}`,
        statusCode: response.status,
        code: 'INVALID_RESPONSE_TYPE',
      });
    }

    if (!response.ok) {
      // 401 Unauthorized handling
      if (response.status === 401) {
        tokenStorage.clear();
        unauthorizedListeners.forEach((listener) => {
          try {
            listener();
          } catch (e) {
            console.error('Unauthorized listener error:', e);
          }
        });
      }

      const errorPayload: ApiErrorPayload = {
        message:
          (responseData && responseData.message) ||
          (responseData && responseData.error) ||
          response.statusText ||
          `Request failed with status ${response.status}`,
        statusCode: response.status,
        code: responseData?.code,
        details: responseData?.details,
      };

      throw new ApiError(errorPayload);
    }

    // Unwrap standardized ApiResponse<T> envelope if present, else return raw
    if (responseData && typeof responseData === 'object' && 'data' in responseData && 'success' in responseData) {
      if (responseData.token || responseData.refreshToken || responseData.data?.token) {
        return {
          ...responseData,
          token: responseData.token || responseData.data?.token,
          refreshToken: responseData.refreshToken || responseData.data?.refreshToken,
          user: responseData.user || responseData.data?.user,
          profile: responseData.profile || responseData.data?.profile,
        } as T;
      }
      return (responseData as ApiResponse<T>).data;
    }

    return responseData as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network / Offline / DNS / CORS failure
    throw new ApiError({
      message: error?.message || 'Network connection error. Please verify your internet or backend server.',
      statusCode: 0,
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }
}

export const httpClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
