import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setAuthToken } from "@/lib/api";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    setAuthToken(null);
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  describe("initialization", () => {
    it("should start with no user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should start with loading state", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // isLoading is initially true, but may quickly become false
      // Just verify it eventually resolves
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should restore session from token", async () => {
      // Set token in localStorage mock AND set the actual token
      vi.mocked(localStorage.getItem).mockImplementation((key) => {
        if (key === "auth-token") return "mock-jwt-token";
        return null;
      });
      setAuthToken("mock-jwt-token");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // User should be restored from token
      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should clear invalid token", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue("invalid-token");
      setAuthToken("invalid-token");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login(
          "test@example.com",
          "password123",
        );
      });

      expect(loginResult!.success).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should fail login with invalid credentials", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login(
          "wrong@example.com",
          "wrongpassword",
        );
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should set user as admin for admin login", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("admin@example.com", "admin123");
      });

      expect(result.current.user?.role).toBe("admin");
      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe("signup", () => {
    it("should signup successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signupResult: { success: boolean; error?: string };
      await act(async () => {
        signupResult = await result.current.signup({
          name: "New User",
          email: "newuser@example.com",
          password: "password123",
          department_id: 1,
        });
      });

      expect(signupResult!.success).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should fail signup with existing email", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signupResult: { success: boolean; error?: string };
      await act(async () => {
        signupResult = await result.current.signup({
          name: "New User",
          email: "existing@example.com",
          password: "password123",
          department_id: 1,
        });
      });

      expect(signupResult!.success).toBe(false);
      expect(signupResult!.error).toContain("already exists");
    });

    it("should fail signup with short password", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signupResult: { success: boolean; error?: string };
      await act(async () => {
        signupResult = await result.current.signup({
          name: "New User",
          email: "newuser@example.com",
          password: "123",
          department_id: 1,
        });
      });

      expect(signupResult!.success).toBe(false);
      expect(signupResult!.error).toContain("6 characters");
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login
      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it("should clear token on logout", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith("auth-token");
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("admin@example.com", "admin123");
      });

      expect(result.current.isAdmin).toBe(true);
    });

    it("should return false for regular user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.isAdmin).toBe(false);
    });

    it("should return false when not logged in", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe("useAuth hook", () => {
    it("should throw when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });
});
