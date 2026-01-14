import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type {
  UserPublic,
  LoginRequest,
  SignupRequest,
  DepartmentName,
} from "@/types/api";
import { DEPARTMENT_NAMES } from "@/types/api";
import {
  setUnauthorizedCallback,
  clearUnauthorizedCallback,
} from "@/lib/api-client";

const AUTH_STORAGE_KEY = "auth-user";
// Use empty string to leverage Vite proxy, or fall back to VITE_API_URL for production
const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || "") : "";

interface AuthContextType {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{
    success: boolean;
    error?: string;
    mustChangePassword?: boolean;
  }>;
  signup: (
    data: SignupRequest,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<UserPublic>) => void;
  clearMustChangePassword: () => void;
  isAdmin: boolean;
  isSuperuser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Available departments for registration - using backend DepartmentName type
// eslint-disable-next-line react-refresh/only-export-components
export const departments: DepartmentName[] = DEPARTMENT_NAMES;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      // Check if there's cached user data - if not, skip API call to avoid 401 error
      const cachedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!cachedUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Validate token by calling /api/auth/me - cookie is sent automatically
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user as UserPublic);
          setMustChangePassword(data.mustChangePassword || false);
          // Store user data for quick access
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        } else {
          // Token is invalid, clear credentials
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        }
      } catch {
        // Network error or invalid response - clear credentials
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string,
      rememberMe: boolean = false,
    ): Promise<{
      success: boolean;
      error?: string;
      mustChangePassword?: boolean;
    }> => {
      try {
        const loginRequest: LoginRequest = { email: username, password, rememberMe };

        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginRequest),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return {
            success: false,
            error: data.error || "Invalid username or password",
          };
        }

        if (data.success && data.user) {
          // Cookie is set by the server response

          // Use UserPublic type directly from API response
          const apiUser: UserPublic = data.user;

          setUser(apiUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(apiUser));

          // Check if password change is required
          if (data.mustChangePassword || apiUser.must_change_password) {
            setMustChangePassword(true);
            return { success: true, mustChangePassword: true };
          }

          return { success: true };
        }

        return { success: false, error: "Login failed" };
      } catch (error) {
        // Network error - API is required, no fallback to mock data
        return {
          success: false,
          error:
            error instanceof Error
              ? `Network error: ${error.message}`
              : "Unable to connect to server. Please check your network connection.",
        };
      }
    },
    [],
  );

  const signup = useCallback(
    async (
      data: SignupRequest,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          return {
            success: false,
            error: result.error || "Registration failed",
          };
        }

        if (result.success && result.user) {
          // Cookie is set by the server response

          // Use UserPublic type directly from API response
          const apiUser: UserPublic = result.user;

          setUser(apiUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(apiUser));

          return { success: true };
        }

        return { success: false, error: "Registration failed" };
      } catch (error) {
        // Network error - API is required, no fallback
        return {
          success: false,
          error:
            error instanceof Error
              ? `Network error: ${error.message}`
              : "Unable to connect to server. Please check your network connection.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear cookie
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout failed", e);
    }
    setUser(null);
    setMustChangePassword(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  // Register the logout callback with the API client for 401 handling
  useEffect(() => {
    setUnauthorizedCallback(logout);
    return () => {
      clearUnauthorizedCallback();
    };
  }, [logout]);

  const updateUser = useCallback((updates: Partial<UserPublic>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
  }, []);

  const isSuperuser = user?.role === "superuser";
  const isAdmin = user?.role === "admin" || isSuperuser;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mustChangePassword,
        login,
        signup,
        logout,
        updateUser,
        clearMustChangePassword,
        isAdmin,
        isSuperuser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
