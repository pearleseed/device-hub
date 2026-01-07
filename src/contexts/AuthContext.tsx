import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, users } from '@/lib/mockData';

const AUTH_STORAGE_KEY = 'auth-user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get stored user
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const userData = JSON.parse(stored);
      // Verify user still exists in mock data
      const validUser = users.find(u => u.id === userData.id);
      return validUser || null;
    }
  } catch {
    // Invalid stored data
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by email (username)
    const foundUser = users.find(u => u.email.toLowerCase() === username.toLowerCase());
    
    if (!foundUser) {
      return { success: false, error: 'Invalid username or password' };
    }

    // In a real app, you'd verify the password here
    // For demo, any password works
    if (password.length < 1) {
      return { success: false, error: 'Password is required' };
    }

    setUser(foundUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
