/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { authAPI, setAuthToken, getAuthToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface SignupData {
  name: string;
  email: string;
  password: string;
  department_id: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await authAPI.me();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear it
            setAuthToken(null);
          }
        } catch {
          // Token is invalid, clear it
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await authAPI.login({ email, password });

        if (response.success && response.user) {
          setUser(response.user);
          return { success: true };
        }

        return { success: false, error: response.error || "Login failed" };
      } catch (error) {
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    [],
  );

  const signup = useCallback(
    async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await authAPI.signup({
          name: data.name,
          email: data.email,
          password: data.password,
          department_id: data.department_id,
        });

        if (response.success && response.user) {
          setUser(response.user);
          return { success: true };
        }

        return { success: false, error: response.error || "Signup failed" };
      } catch (error) {
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout,
      isAdmin,
    }),
    [user, isAuthenticated, isLoading, login, signup, logout, isAdmin],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
