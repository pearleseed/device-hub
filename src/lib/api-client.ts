/**
 * Centralized API Client for Device Hub
 *
 * Handles all HTTP requests to the backend with:
 * - Automatic JWT token attachment
 * - Error handling and typed errors
 * - Response parsing from ApiResponse<T> wrapper
 */

import type { ApiResponse } from "@/types/api";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_BASE_URL = "http://localhost:3001";
const AUTH_TOKEN_KEY = "auth-token";

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error thrown when the API returns an error response
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error thrown when a network error occurs (no response from server)
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public endpoint: string,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

// ============================================================================
// API Client Configuration
// ============================================================================

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized: () => void;
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  /**
   * Build headers for requests, including auth token if available
   */
  private buildHeaders(includeContentType: boolean = false): HeadersInit {
    const headers: HeadersInit = {};

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value);
        }
      });
    }

    return url.toString();
  }

  /**
   * Handle response and extract data from ApiResponse wrapper
   */
  private async handleResponse<T>(
    response: Response,
    endpoint: string,
  ): Promise<T> {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      this.onUnauthorized();
      throw new ApiError("Unauthorized - please log in again", 401, endpoint);
    }

    // Try to parse JSON response
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        `Invalid response from server: ${response.statusText}`,
        response.status,
        endpoint,
      );
    }

    // Check for API-level errors
    if (!data.success) {
      throw new ApiError(
        data.error || data.message || "An unknown error occurred",
        response.status,
        endpoint,
      );
    }

    // Return the data (may be undefined for void responses)
    return data.data as T;
  }

  /**
   * Perform a fetch request with error handling
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      params?: Record<string, string>;
      body?: unknown;
      includeContentType?: boolean;
    } = {},
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const hasBody = options.body !== undefined;
    // Set Content-Type for POST/PUT/PATCH requests (when includeContentType is true)
    // or when there's a body
    const shouldIncludeContentType = options.includeContentType || hasBody;

    try {
      const response = await fetch(url, {
        method,
        headers: this.buildHeaders(shouldIncludeContentType),
        body: hasBody ? JSON.stringify(options.body) : undefined,
      });

      return await this.handleResponse<T>(response, endpoint);
    } catch (error) {
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Wrap network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new NetworkError(
          "Unable to connect to server. Please check your network connection.",
          endpoint,
        );
      }

      // Wrap other errors
      throw new NetworkError(
        error instanceof Error
          ? error.message
          : "An unknown network error occurred",
        endpoint,
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", endpoint, { params });
  }

  /**
   * POST request
   * Always sets Content-Type: application/json
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, {
      body: data,
      includeContentType: true,
    });
  }

  /**
   * PUT request
   * Always sets Content-Type: application/json
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>("PUT", endpoint, {
      body: data,
      includeContentType: true,
    });
  }

  /**
   * PATCH request
   * Always sets Content-Type: application/json
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>("PATCH", endpoint, {
      body: data,
      includeContentType: true,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>("DELETE", endpoint);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

// Callback for unauthorized responses - will be set by AuthContext
let unauthorizedCallback: (() => void) | null = null;

/**
 * Set the callback to be called when a 401 response is received
 */
export function setUnauthorizedCallback(callback: () => void): void {
  unauthorizedCallback = callback;
}

/**
 * Clear the unauthorized callback
 */
export function clearUnauthorizedCallback(): void {
  unauthorizedCallback = null;
}

/**
 * Get the base URL from environment or use default
 */
function getBaseUrl(): string {
  // Vite exposes env variables on import.meta.env
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return DEFAULT_BASE_URL;
}

/**
 * Get the auth token from localStorage
 */
function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Handle unauthorized response
 */
function handleUnauthorized(): void {
  // Clear the token
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // Call the registered callback if available
  if (unauthorizedCallback) {
    unauthorizedCallback();
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient({
  baseUrl: getBaseUrl(),
  getToken,
  onUnauthorized: handleUnauthorized,
});

// ============================================================================
// Token Management Utilities
// ============================================================================

/**
 * Store the auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Remove the auth token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Check if an auth token exists
 */
export function hasAuthToken(): boolean {
  return getToken() !== null;
}
