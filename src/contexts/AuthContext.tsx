import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { User } from "@/lib/mockData";
import { users } from "@/lib/mockData";

const AUTH_STORAGE_KEY = "auth-user";
const REGISTERED_USERS_KEY = "registered-users";

interface RegisterData {
  name: string;
  email: string;
  department: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Available departments for registration
export const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "IT",
  "Legal",
  "Customer Support",
];

// Helper to get stored user
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const userData = JSON.parse(stored);
      // Check in registered users first
      const registeredUsers = getRegisteredUsers();
      const registeredUser = registeredUsers.find((u) => u.id === userData.id);
      if (registeredUser) return registeredUser;
      // Verify user still exists in mock data
      const validUser = users.find((u) => u.id === userData.id);
      return validUser || null;
    }
  } catch {
    // Invalid stored data
  }
  return null;
};

// Helper to get registered users from localStorage
const getRegisteredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid stored data
  }
  return [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(
    async (
      username: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check registered users first
      const registeredUsers = getRegisteredUsers();
      const registeredUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === username.toLowerCase(),
      );

      if (registeredUser) {
        // In a real app, you'd verify the password here
        if (password.length < 1) {
          return { success: false, error: "Password is required" };
        }
        setUser(registeredUser);
        return { success: true };
      }

      // Find user by email (username) in mock data
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === username.toLowerCase(),
      );

      if (!foundUser) {
        return { success: false, error: "Invalid username or password" };
      }

      // In a real app, you'd verify the password here
      // For demo, any password works
      if (password.length < 1) {
        return { success: false, error: "Password is required" };
      }

      setUser(foundUser);
      return { success: true };
    },
    [],
  );

  const register = useCallback(
    async (
      data: RegisterData,
    ): Promise<{ success: boolean; error?: string }> => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if email already exists in mock users
      const existingMockUser = users.find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase(),
      );
      if (existingMockUser) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      // Check if email already exists in registered users
      const registeredUsers = getRegisteredUsers();
      const existingRegisteredUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase(),
      );
      if (existingRegisteredUser) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      // Create new user
      const newUser: User = {
        id: `reg-${Date.now()}`,
        name: data.name,
        email: data.email,
        department: data.department,
        role: "user",
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      };

      // Save to registered users
      const updatedUsers = [...registeredUsers, newUser];
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedUsers));

      // Auto-login the user after registration
      setUser(newUser);
      return { success: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
