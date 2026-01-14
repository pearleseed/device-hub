/**
 * Test API Client for Device Hub
 *
 * Provides a wrapper around fetch for making authenticated test requests
 * to the backend API during integration testing.
 */

import type { ApiResponse, UserPublic } from "../../src/types/api";
import { TEST_CONFIG, TEST_USERS } from "../test-config";

// ============================================================================
// Types
// ============================================================================

export interface TestResponse<T> {
  status: number;
  data: ApiResponse<T>;
  headers: Headers;
}

export interface LoginResult {
  token: string;
  user: UserPublic;
}

// ============================================================================
// Test API Client Class
// ============================================================================

export class TestApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = TEST_CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private buildHeaders(
    token?: string,
    includeContentType: boolean = false,
  ): HeadersInit {
    const headers: Record<string, string> = {};

    const activeToken = token || this.authToken;
    if (activeToken) {
      headers["Cookie"] = `auth_token=${activeToken}`;
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
   * Make a raw request and return full response details
   */
  private async rawRequest<T>(
    method: string,
    endpoint: string,
    options: {
      params?: Record<string, string>;
      body?: unknown;
      token?: string;
    } = {},
  ): Promise<TestResponse<T>> {
    const url = this.buildUrl(endpoint, options.params);
    const hasBody = options.body !== undefined;

    const response = await fetch(url, {
      method,
      headers: this.buildHeaders(options.token, hasBody),
      body: hasBody ? JSON.stringify(options.body) : undefined,
      // @ts-ignore - Bun-specific fetch option
      tls: {
        rejectUnauthorized: false,
      },
    });

    const data = (await response.json()) as ApiResponse<T>;

    return {
      status: response.status,
      data,
      headers: response.headers,
    };
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    token?: string,
    params?: Record<string, string>,
  ): Promise<TestResponse<T>> {
    return this.rawRequest<T>("GET", endpoint, { token, params });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    token?: string,
  ): Promise<TestResponse<T>> {
    return this.rawRequest<T>("POST", endpoint, { body: data, token });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: unknown,
    token?: string,
  ): Promise<TestResponse<T>> {
    return this.rawRequest<T>("PUT", endpoint, { body: data, token });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: unknown,
    token?: string,
  ): Promise<TestResponse<T>> {
    return this.rawRequest<T>("PATCH", endpoint, { body: data, token });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<TestResponse<T>> {
    return this.rawRequest<T>("DELETE", endpoint, { token });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const response = await this.post<{ token: string; user: UserPublic }>(
      "/api/auth/login",
      { email, password },
    );

    // Auth endpoint returns token and user directly in the response, not nested in data
    const authResponse = response.data as unknown as {
      success: boolean;
      token?: string;
      user?: UserPublic;
      error?: string;
    };

    // Extract token from Set-Cookie header
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/auth_token=([^;]+)/);
      if (match && authResponse.user) {
        this.authToken = match[1];
        return {
          token: match[1],
          user: authResponse.user,
        };
      }
    }

    throw new Error("Login failed: No auth cookie received");
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin(): Promise<LoginResult> {
    return this.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
  }

  /**
   * Login as superuser
   */
  async loginAsSuperuser(): Promise<LoginResult> {
    return this.login(
      TEST_USERS.superuser.email,
      TEST_USERS.superuser.password,
    );
  }

  /**
   * Login as regular user
   */
  async loginAsUser(): Promise<LoginResult> {
    return this.login(TEST_USERS.user.email, TEST_USERS.user.password);
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.authToken = null;
  }

  /**
   * Set authentication token manually
   */
  setToken(token: string | null): void {
    this.authToken = token;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const testApiClient = new TestApiClient();
